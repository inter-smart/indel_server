const { models } = require("../../models/index");
const CacheService = require("../../services/cacheService");
const CustomError = require("../../utils/customError");

// Users Controller
class ApplicantsController {
  static async create(req, res, next) {
    try {
      const updateData = { ...req.body };

      const { preffered_location } = updateData;

      const location = await models.CareerLocations.findByPk(
        preffered_location
      );
      if (!location) {
        throw new CustomError("Preferred location not found", 404);
      }

      const applicant = await models.Applicants.create(updateData);

      await CacheService.invalidate("applicants");
      res
        .status(201)
        .json({ success: true, data: applicant, message: "Applicant created" });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req, res, next) {
    try {
      const { limit = "10", offset = "0", location_id, state_id, search } = req.query;

      const parsedLimit = Math.max(1, parseInt(limit, 10) || 10); // Ensure limit >= 1
      const parsedOffset = Math.max(0, parseInt(offset, 10) || 0); // Ensure offset >= 0

      // Build cache key based on query parameters
      const cacheKey = `applicants_${location_id || "all"}_${state_id || "all"}_${search || "all"}_${parsedLimit}_${parsedOffset}`;
      const cachedData = await CacheService.get(cacheKey);

      // if (cachedData) {
      //   return res.json({ success: true, data: JSON.parse(cachedData) });
      // }
      
      const whereConditions = {};
      const { Op } = require('sequelize');

      // Handle location filtering
      if (location_id) {
        whereConditions.id = {
          [Op.in]: require('sequelize').literal(`(
            SELECT applicant_id 
            FROM "applicant_locations" 
            WHERE location_id = ${parseInt(location_id)}
          )`)
        };
      }

      // Handle state filtering
      if (state_id) {
        whereConditions.id = {
          [Op.in]: require('sequelize').literal(`(
            SELECT applicant_id 
            FROM "applicant_states" 
            WHERE state_id = ${parseInt(state_id)}
          )`)
        };
      }

      // Handle combined filtering for both location and state
      if (location_id && state_id) {
        whereConditions.id = {
          [Op.in]: require('sequelize').literal(`(
            SELECT DISTINCT al.applicant_id 
            FROM "applicant_locations" al
            INNER JOIN "applicant_states" ast ON al.applicant_id = ast.applicant_id
            WHERE al.location_id = ${parseInt(location_id)}
            AND ast.state_id = ${parseInt(state_id)}
          )`)
        };
      }

      // Handle search (searches both name and email with case-insensitive partial match)
      if (search) {
        whereConditions[Op.or] = [
          {
            name: {
              [Op.iLike]: `%${search}%`
            }
          },
          {
            email: {
              [Op.iLike]: `%${search}%`
            }
          }
        ];
      }

      // Always use separate count query to avoid issues with joins
      const total = await models.Applicants.count({
        where: whereConditions,
      });

      const applicants = await models.Applicants.findAll({
        where: whereConditions,
        include: [
          {
            model: models.CareerLocations,
            as: "preferredLocations",
            through: {
              model: models.ApplicantLocations,
              attributes: ["is_primary"],
            },
            attributes: ["id", "location_name"],
            required: false,
          },
          {
            model: models.CareerStates,
            as: "preferredStates",
            through: {
              model: models.ApplicantStates,
              attributes: ["is_primary"],
            },
            attributes: ["id", "state_name"],
            required: false,
          },
        ],
        order: [["created_at", "DESC"]],
        limit: parsedLimit,
        offset: parsedOffset,
      });

      await CacheService.set(cacheKey, JSON.stringify(applicants), 3600);
      res.json({
        success: true,
        data: applicants,
        total,
        pagination: {
          page: Math.floor(parsedOffset / parsedLimit) + 1,
          totalPages: Math.ceil(total / parsedLimit),
          limit: parsedLimit,
          offset: parsedOffset,
          hasNextPage: Math.floor(parsedOffset / parsedLimit) + 1 < Math.ceil(total / parsedLimit),
          hasPrevPage: Math.floor(parsedOffset / parsedLimit) + 1 > 1,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const { id } = req.params;

      console.log(id)
      const cacheKey = `applicant_${id}`;
      const cachedData = await CacheService.get(cacheKey);
      // if (cachedData) {
      //   return res.json({ success: true, data: JSON.parse(cachedData) });
      // }

      const applicant = await models.Applicants.findByPk(id, {
        include: [
          {
            model: models.CareerLocations,
            as: "preferredLocations",
            through: {
              model: models.ApplicantLocations,
              attributes: ["is_primary"],
            },
            attributes: ["id", "location_name"],
            required: false,
          },
          {
            model: models.CareerStates,
            as: "preferredStates",
            through: {
              model: models.ApplicantStates,
              attributes: ["is_primary"],
            },
            attributes: ["id", "state_name"],
            required: false,
          },
        ],
      });
      if (!applicant) {
        throw new CustomError("Applicant not found", 404);
      }

      // Fetch applied jobs with related job, role, and status details
      const appliedJobs = await models.JobApplications.findAll({
        where: { applicant_id: id },
        include: [
          {
            model: models.CareerJobs,
            as: "job",
            // Preserve job context in an applicant's history after soft deletion.
            paranoid: false,
            // attributes: ["id", "job_title"],
            include: [
              {
                model: models.CareerRoles,
                as: "role",
                attributes: ["role_name"],
              },
              {
                model: models.CareerLocations,
                as: "locations",
                attributes: ["location_name"],
              },
              {
                model: models.CareerStates,
                as: "states",
                attributes: ["state_name"],
              },
            ],
          },
          {
            model: models.ApplicationStatus,
            as: "status",
            attributes: ["status_name"],
          },
        ],
        order: [["application_date", "ASC"]],
      });

      // Format response
      const response = {
        applicant: {
          id: applicant.id,
          name: applicant.name,
          email: applicant.email,
          phone: applicant.phone,
          location: applicant.location
            ? applicant.location.location_name
            : applicant.current_location || null,
            applicant,
          resume: applicant.file,
        },
        appliedJobs: appliedJobs.map((job) => ({
          id: job.id,
          jobTitle: job.job ? job.job.job_title : null,
          location: job.job ? job.job.location : null,
          state: job.job ? job.job.state : null,
          department: job.job && job.job.role ? job.job.role.role_name : null,
          status: job.status ? job.status.status_name : null,
          appliedDate: job.application_date
            ? job.application_date.toISOString().split("T")[0]
            : null,
        })),
      };

      await CacheService.set(
        cacheKey,
        JSON.stringify(applicant, appliedJobs),
        3600
      );
      res.json({
        success: true,
        data: response,
        message: "Applicant details fetched",
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const applicant = await models.Applicants.findByPk(id);
      if (!applicant) {
        throw new CustomError("Applicant not found", 404);
      }

      const updateData = { ...req.body };

      if (updateData.preffered_location) {
        const location = await models.CareerLocations.findByPk(
          updateData.preffered_location
        );
        if (!location)
          throw new CustomError("Preferred location not found", 404);
      }

      await applicant.update(updateData);

      await Promise.all([
        CacheService.invalidate("applicants"),
        CacheService.invalidate(`applicant_${id}`),
      ]);
      res.json({
        success: true,
        data: applicant,
        message: "Applicant updated",
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const { id } = req.params;
      const applicant = await models.Applicants.findByPk(id);
      if (!applicant) {
        throw new CustomError("Applicant not found", 404);
      }

      await applicant.destroy();

      await Promise.all([
        CacheService.invalidate("applicants"),
        CacheService.invalidate(`applicant_${id}`),
      ]);
      res.json({ success: true, message: "Applicant deleted", data: id });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ApplicantsController;
