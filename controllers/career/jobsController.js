const { literal, Op } = require("sequelize");
const { models, sequelize } = require("../../models/index");
const CacheService = require("../../services/cacheService");
const CustomError = require("../../utils/customError");
const { sendMailToHRs } = require("../../services/emailService");

const User = models.User;
const Jobs = models.CareerJobs;

class JobsController {
  static async create(req, res, next) {
    try {
      const {
        role_id,
        job_title,
        job_description,
        experience,
        is_active,
        is_approved,
        end_date,
        order,
        reapply_period_months,
        location_ids,
        state_ids,
        is_display_full_locations,
        is_pan_india, // New field
      } = req.body;

      // Validation logic for pan India vs specific locations
      if (is_pan_india) {
        // For pan India jobs, locations and states are optional
        // You might want to ignore location_ids and state_ids or store them as preferences
        if (location_ids && location_ids.length > 0) {
          console.warn("Pan India job provided with specific locations. Locations will be ignored.");
        }
        if (state_ids && state_ids.length > 0) {
          console.warn("Pan India job provided with specific states. States will be ignored.");
        }
      } else {
        // For non-pan India jobs, require at least one location and state
        if (!Array.isArray(location_ids) || location_ids.length === 0)
          throw new CustomError("At least one location is required for non-pan India jobs", 400);
        if (!Array.isArray(state_ids) || state_ids.length === 0) throw new CustomError("At least one state is required for non-pan India jobs", 400);

        const existingLocations = await models.CareerLocations.findAll({
          where: { id: location_ids },
        });
        if (existingLocations.length !== location_ids.length) throw new CustomError("One or more locations not found", 404);

        const existingStates = await models.CareerStates.findAll({
          where: { id: state_ids },
        });
        if (existingStates.length !== state_ids.length) throw new CustomError("One or more states not found", 404);
      }

      const jobData = {
        role_id,
        job_title,
        job_description,
        experience,
        is_active: is_active ?? true,
        is_approved: is_approved ?? false,
        end_date: end_date ? new Date(end_date) : null,
        order,
        reapply_period_months,
        is_display_full_locations,
        is_pan_india: is_pan_india ?? false, // Default to false
      };

      if (jobData.end_date && isNaN(jobData.end_date.getTime())) throw new CustomError("Invalid end_date format", 400);

      const job = await Jobs.create(jobData);

      // Only add location and state associations for non-pan India jobs
      if (!is_pan_india) {
        await job.addLocations(location_ids);
        await job.addStates(state_ids);
      }

      // Send notification email to all HR users
      const hrUsers = await User.findAll({ where: { role: "hr", isActive: true } });
      const hrEmails = hrUsers.map((user) => user.email).filter((email) => !!email);

      if (hrEmails.length > 0) {
        await sendMailToHRs(hrEmails, job_title);
      }

      await Promise.all([CacheService.invalidate("jobs"), CacheService.invalidate("webCareerPage")]);

      res.status(201).json({ success: true, data: job, message: "Job created" });
    } catch (error) {
      next(error);
    }
  }

  static async getAllFiltered(req, res, next) {
    const capitalizeWords = (str) => {
      if (!str) return str;
      return str
        .toLowerCase()
        .split(/(\s+|-)/)
        .map((word, index, arr) => {
          if (word.match(/^\s+|-/)) return word;
          return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join("");
    };

    try {
      const { state_id, location_id, role_id, page = 1, limit = 10 } = req.query;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const pageNumber = parseInt(page) || 1;
      const pageSize = parseInt(limit) || 10;
      const offset = (pageNumber - 1) * pageSize;

      // Build where conditions for the Job model
      const jobWhereConditions = {
        is_active: true,
        is_approved: true,
        end_date: {
          [Op.gte]: today,
        },
      };

      if (role_id) {
        jobWhereConditions.role_id = parseInt(role_id);
      }

      const includeOptions = [
        {
          model: models.CareerRoles,
          as: "role",
          attributes: ["role_name"],
        },
        {
          model: models.CareerLocations,
          as: "locations",
          attributes: ["location_name"],
          through: { attributes: [] },
          required: false, // Make it optional since pan India jobs might not have locations
          include: [
            {
              model: models.Districts,
              as: "district",
              attributes: ["state_id"],
              where: { is_active: true },
              required: false,
              include: [
                {
                  model: models.CareerStates,
                  as: "state",
                  attributes: ["id", "state_name"],
                  required: false,
                },
              ],
            },
          ],
        },
        {
          model: models.CareerStates,
          as: "states",
          attributes: ["id", "state_name"],
          through: { attributes: [] },
          required: false, // Make it optional since pan India jobs might not have states
        },
      ];

      // Handle filtering with pan India consideration
      let additionalWhereConditions = {};

      // For location filtering: show pan India jobs OR jobs with matching location
      if (location_id) {
        additionalWhereConditions = {
          ...additionalWhereConditions,
          [Op.or]: [
            { is_pan_india: true }, // Always include pan India jobs
            sequelize.literal(`EXISTS (
              SELECT 1 FROM job_locations jl 
              WHERE jl.job_id = "Jobs"."id" 
              AND jl.location_id = ${parseInt(location_id)}
            )`),
          ],
        };
      }

      // For state filtering: show pan India jobs OR jobs with matching state
      if (state_id) {
        const stateCondition = {
          [Op.or]: [
            { is_pan_india: true }, // Always include pan India jobs
            sequelize.literal(`EXISTS (
              SELECT 1 FROM job_states js 
              WHERE js.job_id = "Jobs"."id" 
              AND js.state_id = ${parseInt(state_id)}
            )`),
          ],
        };

        if (additionalWhereConditions[Op.or]) {
          // If we already have location filtering, we need to combine conditions
          additionalWhereConditions = {
            [Op.and]: [additionalWhereConditions, stateCondition],
          };
        } else {
          additionalWhereConditions = stateCondition;
        }
      }

      const finalWhereConditions = {
        ...jobWhereConditions,
        ...additionalWhereConditions,
      };

      const jobs = await Jobs.findAll({
        where: finalWhereConditions,
        attributes: {
          include: [
            [
              sequelize.literal(`(
                SELECT COUNT(*)
                FROM job_applications AS ja
                WHERE ja.job_id = "Jobs"."id"
              )`),
              "application_count",
            ],
          ],
        },
        include: includeOptions,
        order: [
          ["order", "ASC"],
          ["id", "ASC"],
        ],
        limit: pageSize,
        offset: offset,
      });

      // Count query with same filtering logic
      let countWhereConditions = { ...jobWhereConditions };

      if (location_id) {
        countWhereConditions = {
          ...countWhereConditions,
          [Op.or]: [
            { is_pan_india: true },
            sequelize.literal(`EXISTS (
              SELECT 1 FROM job_locations jl 
              WHERE jl.job_id = "Jobs"."id" 
              AND jl.location_id = ${parseInt(location_id)}
            )`),
          ],
        };
      }

      if (state_id) {
        const stateCountCondition = {
          [Op.or]: [
            { is_pan_india: true },
            sequelize.literal(`EXISTS (
              SELECT 1 FROM job_states js 
              WHERE js.job_id = "Jobs"."id" 
              AND js.state_id = ${parseInt(state_id)}
            )`),
          ],
        };

        if (countWhereConditions[Op.or]) {
          countWhereConditions = {
            [Op.and]: [countWhereConditions, stateCountCondition],
          };
        } else {
          countWhereConditions = stateCountCondition;
        }
      }

      const totalCount = await Jobs.count({
        where: countWhereConditions,
      });

      // Process jobs to format locations with pan India consideration
      const formattedJobs = jobs.map((job) => {
        let locationDisplay = "";

        if (job.is_pan_india) {
          locationDisplay = "Pan India";
        } else if (job.states && job.states.length > 0) {
          // Existing logic for specific locations
          const stateLocationMap = job.states.map((state) => {
            const stateLocations = job.locations
              .filter((loc) => loc.district && loc.district.state_id === state.id)
              .map((loc) => capitalizeWords(loc.location_name))
              .filter(Boolean);

            if (job.is_display_full_locations) {
              if (stateLocations.length > 0) {
                const lastLocation = stateLocations.pop();
                const locationString = stateLocations.length > 0 ? `${stateLocations.join(", ")} and ${lastLocation}` : lastLocation;
                return `${capitalizeWords(state.state_name)}: ${locationString}${stateLocations.length + 1 > 3 ? ", etc." : ""}`;
              }
              return `${capitalizeWords(state.state_name)}: No Specific Locations`;
            } else {
              return stateLocations.length > 0
                ? `${capitalizeWords(state.state_name)}: Multiple Locations`
                : `${capitalizeWords(state.state_name)}: No Specific Locations`;
            }
          });

          locationDisplay = stateLocationMap.join("; ");
        } else {
          // Fallback for jobs without proper state/location data
          if (job.is_display_full_locations && job.locations.length > 0) {
            const locations = job.locations.map((loc) => capitalizeWords(loc.location_name)).filter(Boolean);
            const lastLocation = locations.pop();
            const locationString = locations.length > 0 ? `${locations.join(", ")} and ${lastLocation}` : lastLocation;
            locationDisplay = `Unknown State: ${locationString}${locations.length + 1 > 3 ? ", etc." : ""}`;
          } else {
            locationDisplay = `Unknown State: ${job.locations.length > 0 ? "Multiple Locations" : "No Specific Locations"}`;
          }
        }

        return {
          ...job.toJSON(),
          locationDisplay,
        };
      });

      res.json({
        success: true,
        data: formattedJobs,
        pagination: {
          currentPage: pageNumber,
          totalPages: Math.ceil(totalCount / pageSize),
          totalItems: totalCount,
          itemsPerPage: pageSize,
          hasNextPage: pageNumber < Math.ceil(totalCount / pageSize),
          hasPrevPage: pageNumber > 1,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    const capitalizeWords = (str) => {
      if (!str) return str;
      return str
        .toLowerCase()
        .split(/(\s+|-)/)
        .map((word, index, arr) => {
          if (word.match(/^\s+|-/)) return word;
          return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join("");
    };

    try {
      const { id } = req.params;
      const cacheKey = `job_${id}`;

      const job = await Jobs.findByPk(id, {
        include: [
          { model: models.CareerRoles, as: "role", attributes: ["role_name"] },
          {
            model: models.CareerLocations,
            as: "locations",
            attributes: ["id", "location_name", "district_id"],
            through: { attributes: [] },
            required: false,
            include: [
              {
                model: models.Districts,
                as: "district",
                attributes: ["state_id"],
                required: false,
                include: [
                  {
                    model: models.CareerStates,
                    as: "state",
                    attributes: ["id", "state_name"],
                    required: false,
                  },
                ],
              },
            ],
          },
          {
            model: models.CareerStates,
            as: "states",
            attributes: ["id", "state_name"],
            through: { attributes: [] },
            required: false,
          },
        ],
      });

      if (!job) {
        throw new CustomError("Job not found", 404);
      }

      // Process job to format locations with pan India consideration
      let locationDisplay = "";

      if (job.is_pan_india) {
        locationDisplay = "Pan India";
      } else if (job.states && job.states.length > 0) {
        // Existing location formatting logic
        const stateLocationMap = job.states.map((state) => {
          const stateLocations = job.locations
            .filter((loc) => loc.district && loc.district.state_id === state.id)
            .map((loc) => capitalizeWords(loc.location_name))
            .filter(Boolean);

          if (job.is_display_full_locations) {
            if (stateLocations.length > 0) {
              const lastLocation = stateLocations.pop();
              const locationString = stateLocations.length > 0 ? `${stateLocations.join(", ")} and ${lastLocation}` : lastLocation;
              return `${capitalizeWords(state.state_name)}: ${locationString}${stateLocations.length + 1 > 3 ? ", etc." : ""}`;
            }
            return `${capitalizeWords(state.state_name)}: No Specific Locations`;
          } else {
            return stateLocations.length > 0
              ? `${capitalizeWords(state.state_name)}: Multiple Locations`
              : `${capitalizeWords(state.state_name)}: No Specific Locations`;
          }
        });

        locationDisplay = stateLocationMap.join("; ");
      } else {
        // Fallback
        if (job.is_display_full_locations && job.locations.length > 0) {
          const locations = job.locations.map((loc) => capitalizeWords(loc.location_name)).filter(Boolean);
          const lastLocation = locations.pop();
          const locationString = locations.length > 0 ? `${locations.join(", ")} and ${lastLocation}` : lastLocation;
          locationDisplay = `Unknown State: ${locationString}${locations.length + 1 > 3 ? ", etc." : ""}`;
        } else {
          locationDisplay = `Unknown State: ${job.locations.length > 0 ? "Multiple Locations" : "No Specific Locations"}`;
        }
      }

      const formattedJob = {
        ...job.toJSON(),
        locationDisplay,
      };

      await CacheService.set(cacheKey, JSON.stringify(formattedJob), 3600);
      res.json({ success: true, data: formattedJob });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const job = await Jobs.findByPk(id);
      if (!job) {
        throw new CustomError("Job not found", 404);
      }

      const {
        role_id,
        job_title,
        job_description,
        experience,
        is_active,
        is_approved,
        end_date,
        order,
        reapply_period_months,
        location_ids,
        state_ids,
        is_display_full_locations,
        is_pan_india, // New field
      } = req.body;

      // Validation for pan India vs specific locations
      if (is_pan_india !== undefined) {
        if (is_pan_india) {
          // For pan India jobs, clear existing location and state associations
          await job.setLocations([]);
          await job.setStates([]);
        } else {
          // For non-pan India jobs, validate locations and states
          if (location_ids) {
            if (!Array.isArray(location_ids) || location_ids.length === 0) {
              throw new CustomError("At least one location is required for non-pan India jobs", 400);
            }
            const existingLocations = await models.CareerLocations.findAll({ where: { id: location_ids } });
            if (existingLocations.length !== location_ids.length) {
              throw new CustomError("One or more locations not found", 404);
            }
          }
          if (state_ids) {
            if (!Array.isArray(state_ids) || state_ids.length === 0) {
              throw new CustomError("At least one state is required for non-pan India jobs", 400);
            }
            const existingStates = await models.CareerStates.findAll({ where: { id: state_ids } });
            if (existingStates.length !== state_ids.length) {
              throw new CustomError("One or more states not found", 404);
            }
          }
        }
      } else {
        // If is_pan_india is not being updated, validate based on current value
        if (!job.is_pan_india) {
          if (location_ids) {
            if (!Array.isArray(location_ids) || location_ids.length === 0) {
              throw new CustomError("At least one location is required", 400);
            }
            const existingLocations = await models.CareerLocations.findAll({ where: { id: location_ids } });
            if (existingLocations.length !== location_ids.length) {
              throw new CustomError("One or more locations not found", 404);
            }
          }
          if (state_ids) {
            if (!Array.isArray(state_ids) || state_ids.length === 0) {
              throw new CustomError("At least one state is required", 400);
            }
            const existingStates = await models.CareerStates.findAll({ where: { id: state_ids } });
            if (existingStates.length !== state_ids.length) {
              throw new CustomError("One or more states not found", 404);
            }
          }
        }
      }

      const updateData = {
        role_id,
        job_title,
        job_description,
        experience,
        is_active,
        is_approved,
        end_date,
        order,
        reapply_period_months,
        is_display_full_locations,
        is_pan_india,
      };

      // Remove undefined values
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      // if (end_date && updateData.end_date && isNaN(updateData.end_date.getTime())) {
      //   throw new CustomError("Invalid end_date format", 400);
      // }

      console.log("Updating job with data:", updateData);

      await job.update(updateData);

      // Update associations only for non-pan India jobs
      const finalIsPanIndia = is_pan_india !== undefined ? is_pan_india : job.is_pan_india;

      if (!finalIsPanIndia) {
        if (location_ids) {
          await job.setLocations(location_ids);
        }
        if (state_ids) {
          await job.setStates(state_ids);
        }
      }

      // Invalidate caches after update
      await Promise.all([CacheService.invalidate("jobs"), CacheService.invalidate("webCareerPage"), CacheService.invalidate(`job_${id}`)]);
      res.json({ success: true, data: job, message: "Job updated" });
    } catch (error) {
      next(error);
    }
  }

  // Keep existing methods (getDropdowns, getAll, delete, updateOrder) unchanged
  static async getDropdowns(req, res, next) {
    try {
      console.log("Fetching job dropdowns...");
      const [roles, locations, states, statuses] = await Promise.all([
        models.CareerRoles.findAll({
          where: { is_active: true },
          attributes: [
            ["id", "value"],
            ["role_name", "label"],
          ],
          order: [["role_name", "ASC"]],
        }),
        models.CareerLocations.findAll({
          where: { is_active: true },
          attributes: [
            ["id", "value"],
            ["location_name", "label"],
          ],
          order: [["location_name", "ASC"]],
        }),
        models.CareerStates.findAll({
          where: { is_active: true },
          attributes: [
            ["id", "value"],
            ["state_name", "label"],
          ],
          order: [["state_name", "ASC"]],
        }),
        models.ApplicationStatus.findAll({
          where: { is_active: true },
          attributes: [
            ["id", "value"],
            ["status_name", "label"],
          ],
          order: [["status_name", "ASC"]],
        }),
      ]);

      res.json({
        success: true,
        data: { roles, locations, states, statuses },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req, res, next) {
    try {
      const { state_id, location_id, role_id, page = 1, limit = 10, type = null } = req.query;

      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
      const offset = (pageNum - 1) * limitNum;

      const jobWhereConditions = {};

      if (type) {
        jobWhereConditions.is_approved = false;
      }

      const includeOptions = [
        { model: models.CareerRoles, as: "role", attributes: ["role_name"] },
        {
          model: models.CareerLocations,
          as: "locations",
          attributes: ["id", "location_name", "district_id"],
          through: { attributes: [] },
          required: !!location_id,
          where: location_id ? { id: parseInt(location_id) } : {},
        },
        {
          model: models.CareerStates,
          as: "states",
          attributes: ["id", "state_name"],
          through: { attributes: [] },
          required: !!state_id,
          where: state_id ? { id: parseInt(state_id) } : {},
        },
      ];

      if (role_id) {
        jobWhereConditions.role_id = parseInt(role_id);
      }

      // Jobs past their end_date are deactivated by a periodic cron job
      // (utils/deactivateExpiredJobs.js) instead of inline here, so a GET
      // request no longer pays for a table-scanning UPDATE on every call.

      // Use separate count query to avoid issues with joins
      const totalItems = await Jobs.count({
        where: jobWhereConditions,
      });

      const jobs = await Jobs.findAll({
        where: jobWhereConditions,
        attributes: {
          include: [
            [
              sequelize.literal(`(
                SELECT COUNT(*)
                FROM job_applications AS ja
                WHERE ja.job_id = "Jobs"."id"
              )`),
              "application_count",
            ],
          ],
        },
        include: includeOptions,
        order: [
          ["order", "ASC"],
          ["id", "ASC"],
        ],
        limit: limitNum,
        offset,
      });

      const totalPages = Math.ceil(totalItems / limitNum);
      const hasNextPage = pageNum < totalPages;
      const hasPrevPage = pageNum > 1;

      res.json({
        success: true,
        data: jobs,
        total: totalItems,
        pagination: {
          page: pageNum,
          totalPages,
          limit: limitNum,
          offset,
          hasNextPage,
          hasPrevPage,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const { id } = req.params;
      const job = await Jobs.findByPk(id);
      if (!job) {
        throw new CustomError("Job not found", 404);
      }

      await job.destroy();

      await Promise.all([CacheService.invalidate("jobs"), CacheService.invalidate("webCareerPage"), CacheService.invalidate(`job_${id}`)]);
      res.json({ success: true, message: "Job deleted", data: id });
    } catch (error) {
      next(error);
    }
  }

  static async updateOrder(req, res, next) {
    try {
      const { jobs } = req.body;
      if (!Array.isArray(jobs) || jobs.length === 0) {
        throw new CustomError("No job order data provided", 400);
      }

      const jobIds = jobs.map((j) => j.id);
      const foundJobs = await Jobs.findAll({ where: { id: jobIds } });
      if (foundJobs.length !== jobs.length) {
        throw new CustomError("Some jobs not found", 404);
      }

      await Jobs.sequelize.transaction(async (t) => {
        for (const { id, order } of jobs) {
          await Jobs.update({ order }, { where: { id }, transaction: t });
        }
      });

      await Promise.all([CacheService.invalidate("jobs"), CacheService.invalidate("webCareerPage")]);

      res.json({ success: true, message: "Job updated successfully" });
    } catch (error) {
      next(error);
    }
  }

  // Job-specific dropdowns API
  static async getJobDropdowns(req, res, next) {
    try {
      const { id } = req.params;
      const jobId = parseInt(id);

      if (isNaN(jobId)) {
        throw new CustomError("Invalid job ID", 400);
      }

      // Check if job exists
      const job = await Jobs.findByPk(jobId);
      if (!job) {
        throw new CustomError("Job not found", 404);
      }

      let job_states, job_locations, roles;

      if (job.is_pan_india) {
        // Pan India job: return all active locations and states
        const [allStates, allLocations, jobWithRole] = await Promise.all([
          models.CareerStates.findAll({
            where: { is_active: true },
            attributes: ["id", "state_name"],
            order: [["state_name", "ASC"]],
          }),
          models.CareerLocations.findAll({
            where: { is_active: true },
            attributes: ["id", "location_name", "district_id"],
            order: [["location_name", "ASC"]],
            include: [
              {
                model: models.Districts,
                as: "district",
                attributes: ["state_id"],
                required: false,
              },
            ],
          }),
          Jobs.findByPk(jobId, {
            include: [{ model: models.CareerRoles, as: "role", attributes: ["id", "role_name"], required: false }],
          }),
        ]);

        job_states = allStates.map((state) => ({ value: state.id.toString(), label: state.state_name }));
        job_locations = allLocations.map((location) => ({
          id: location.id,
          location_name: location.location_name,
          district_id: location.district_id,
        }));
        roles = jobWithRole.role
          ? [{ value: jobWithRole.role.id.toString(), label: jobWithRole.role.role_name }]
          : [];
      } else {
        // Job-specific data
        const jobWithAssociations = await Jobs.findByPk(jobId, {
          include: [
            {
              model: models.CareerStates,
              as: "states",
              attributes: ["id", "state_name"],
              through: { attributes: [] },
              where: { is_active: true },
              required: false,
            },
            {
              model: models.CareerLocations,
              as: "locations",
              attributes: ["id", "location_name", "district_id"],
              through: { attributes: [] },
              where: { is_active: true },
              required: false,
              include: [
                {
                  model: models.Districts,
                  as: "district",
                  attributes: ["state_id"],
                  required: false,
                },
              ],
            },
            {
              model: models.CareerRoles,
              as: "role",
              attributes: ["id", "role_name"],
              required: false,
            },
          ],
        });

        job_states = jobWithAssociations.states.map((state) => ({
          value: state.id.toString(),
          label: state.state_name,
        }));
        job_locations = jobWithAssociations.locations.map((location) => ({
          id: location.id,
          location_name: location.location_name,
          district_id: location.district_id,
        }));
        roles = jobWithAssociations.role
          ? [{ value: jobWithAssociations.role.id.toString(), label: jobWithAssociations.role.role_name }]
          : [];
      }

      res.json({
        success: true,
        data: {
          job_states,
          job_locations,
          roles,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Job-specific locations by state API
  static async getJobLocationsByState(req, res, next) {
    try {
      const { id } = req.params;
      const { state_ids } = req.query;
      const jobId = parseInt(id);

      if (isNaN(jobId)) {
        throw new CustomError("Invalid job ID", 400);
      }

      if (!state_ids) {
        throw new CustomError("state_ids parameter is required", 400);
      }

      // Check if job exists
      const job = await Jobs.findByPk(jobId);
      if (!job) {
        throw new CustomError("Job not found", 404);
      }

      // Parse state_ids (comma-separated string)
      const stateIdArray = state_ids
        .split(",")
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));

      if (stateIdArray.length === 0) {
        throw new CustomError("Invalid state_ids format", 400);
      }

      // Get job-specific locations filtered by states
      const jobWithLocations = await Jobs.findByPk(jobId, {
        include: [
          {
            model: models.CareerLocations,
            as: "locations",
            attributes: ["id", "location_name", "district_id"],
            through: { attributes: [] },
            where: { is_active: true },
            required: true,
            include: [
              {
                model: models.Districts,
                as: "district",
                attributes: ["state_id"],
                where: {
                  state_id: {
                    [Op.in]: stateIdArray,
                  },
                },
                required: true,
              },
            ],
          },
        ],
      });

      // Format locations with state_id
      const locations = jobWithLocations.locations.map((location) => ({
        id: location.id,
        location_name: location.location_name,
        district_id: location.district_id,
        state_id: location.district.state_id,
      }));

      res.json({
        success: true,
        data: locations,
      });
    } catch (error) {
      next(error);
    }
  }

  static async exportAllJobs(req, res, next) {
    try {
      const ExcelJS = require("exceljs");

      const jobs = await Jobs.findAll({
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
            through: { attributes: [] },
          },
          {
            model: models.CareerStates,
            as: "states",
            attributes: ["state_name"],
            through: { attributes: [] },
          },
        ],
        order: [
          ["order", "ASC"],
          ["createdAt", "DESC"],
        ],
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("All Jobs");

      worksheet.columns = [
        { header: "Sl.No", key: "slNo", width: 8 },
        { header: "Job Title", key: "jobTitle", width: 30 },
        { header: "Department", key: "department", width: 20 },
        { header: "Locations", key: "locations", width: 35 },
        { header: "States", key: "states", width: 30 },
        { header: "Experience", key: "experience", width: 20 },
        { header: "Date of Posting", key: "dateOfPosting", width: 20 },
        { header: "End Date of Posting", key: "endDate", width: 20 },
        { header: "Status", key: "status", width: 15 },
      ];

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };

      const formatDate = (date) => {
        if (!date) return "N/A";
        const d = new Date(date);
        if (isNaN(d.getTime())) return "N/A";
        return d.toLocaleDateString("en-GB");
      };

      jobs.forEach((job, index) => {
        const plain = job.toJSON();
        worksheet.addRow({
          slNo: index + 1,
          jobTitle: plain.job_title || "N/A",
          department: plain.role?.role_name || "N/A",
          locations: plain.is_pan_india ? "Pan India" : plain.locations?.length ? plain.locations.map((l) => l.location_name).join(", ") : "N/A",
          states: plain.is_pan_india ? "All India" : plain.states?.length ? plain.states.map((s) => s.state_name).join(", ") : "N/A",
          experience: plain.experience || "N/A",
          dateOfPosting: formatDate(plain.createdAt),
          endDate: formatDate(plain.end_date),
          status: (plain.end_date && new Date(plain.end_date) < new Date()) || !plain.is_active ? "Not Active" : "Active",
        });
      });

      const filename = `all_jobs_${new Date().toISOString().split("T")[0]}.xlsx`;
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = JobsController;

// const { literal, Op } = require("sequelize");
// const { models, sequelize } = require("../../models/index");
// const CacheService = require("../../services/cacheService");
// const CustomError = require("../../utils/customError");
// const { sendMailToHRs } = require("../../services/emailService"); // We'll create this helper

// const User = models.User

// const Jobs = models.CareerJobs;

// class JobsController {
//   // static async create(req, res, next) {
//   //   try {
//   //     const {
//   //       role_id,
//   //       job_title,
//   //       job_description,
//   //       experience,
//   //       is_active,
//   //       is_approved,
//   //       end_date,
//   //       order,
//   //       reapply_period_months,
//   //       location_ids,
//   //       state_ids,
//   //       is_display_full_locations,
//   //     } = req.body;

//   //     // Validate existence of locations and states
//   //     if (!Array.isArray(location_ids) || location_ids.length === 0) {
//   //       throw new CustomError("At least one location is required", 400);
//   //     }
//   //     if (!Array.isArray(state_ids) || state_ids.length === 0) {
//   //       throw new CustomError("At least one state is required", 400);
//   //     }

//   //     const existingLocations = await models.CareerLocations.findAll({ where: { id: location_ids } });
//   //     if (existingLocations.length !== location_ids.length) {
//   //       throw new CustomError("One or more locations not found", 404);
//   //     }

//   //     const existingStates = await models.CareerStates.findAll({ where: { id: state_ids } });
//   //     if (existingStates.length !== state_ids.length) {
//   //       throw new CustomError("One or more states not found", 404);
//   //     }

//   //     // Ensure is_active and end_date are handled correctly
//   //     const jobData = {
//   //       role_id,
//   //       job_title,
//   //       job_description,
//   //       experience,
//   //       is_active: is_active ?? true,
//   //       is_approved: is_approved ?? false,
//   //       end_date: end_date ? new Date(end_date) : null,
//   //       order,
//   //       reapply_period_months,
//   //       is_display_full_locations,
//   //     };

//   //     if (jobData.end_date && isNaN(jobData.end_date.getTime())) {
//   //       throw new CustomError("Invalid end_date format", 400);
//   //     }

//   //     const job = await Jobs.create(jobData);

//   //     // Add associations
//   //     await job.addLocations(location_ids);
//   //     await job.addStates(state_ids);

//   //     // Invalidate caches after creation
//   //     await Promise.all([CacheService.invalidate("jobs"), CacheService.invalidate("webCareerPage")]);
//   //     res.status(201).json({ success: true, data: job, message: "Job created" });
//   //   } catch (error) {
//   //     next(error);
//   //   }
//   // }

//   static async create(req, res, next) {
//     try {
//       const {
//         role_id,
//         job_title,
//         job_description,
//         experience,
//         is_active,
//         is_approved,
//         end_date,
//         order,
//         reapply_period_months,
//         location_ids,
//         state_ids,
//         is_display_full_locations,
//       } = req.body;

//       if (!Array.isArray(location_ids) || location_ids.length === 0)
//         throw new CustomError("At least one location is required", 400);
//       if (!Array.isArray(state_ids) || state_ids.length === 0) throw new CustomError("At least one state is required", 400);

//       const existingLocations = await models.CareerLocations.findAll({
//         where: { id: location_ids },
//       });
//       if (existingLocations.length !== location_ids.length) throw new CustomError("One or more locations not found", 404);

//       const existingStates = await models.CareerStates.findAll({
//         where: { id: state_ids },
//       });
//       if (existingStates.length !== state_ids.length) throw new CustomError("One or more states not found", 404);

//       const jobData = {
//         role_id,
//         job_title,
//         job_description,
//         experience,
//         is_active: is_active ?? true,
//         is_approved: is_approved ?? false,
//         end_date: end_date ? new Date(end_date) : null,
//         order,
//         reapply_period_months,
//         is_display_full_locations,
//       };

//       if (jobData.end_date && isNaN(jobData.end_date.getTime())) throw new CustomError("Invalid end_date format", 400);

//       const job = await Jobs.create(jobData);

//       await job.addLocations(location_ids);
//       await job.addStates(state_ids);

//       // Send notification email to all HR users
//       const hrUsers = await User.findAll({ where: { role: "hr", isActive: true } });

//       const hrEmails = hrUsers.map((user) => user.email).filter((email) => !!email); // Ensure email exists

//       if (hrEmails.length > 0) {
//         await sendMailToHRs(hrEmails, job_title);
//       }

//       await Promise.all([CacheService.invalidate("jobs"), CacheService.invalidate("webCareerPage")]);

//       res.status(201).json({ success: true, data: job, message: "Job created" });
//     } catch (error) {
//       next(error);
//     }
//   }

//   static async getDropdowns(req, res, next) {
//     try {
//       const [roles, locations, states, statuses] = await Promise.all([
//         models.CareerRoles.findAll({
//           where: { is_active: true },
//           attributes: [
//             ["id", "value"],
//             ["role_name", "label"],
//           ],
//           order: [["role_name", "ASC"]],
//         }),
//         models.CareerLocations.findAll({
//           where: { is_active: true },
//           attributes: [
//             ["id", "value"],
//             ["location_name", "label"],
//           ],
//           order: [["location_name", "ASC"]],
//         }),
//         models.CareerStates.findAll({
//           where: { is_active: true },
//           attributes: [
//             ["id", "value"],
//             ["state_name", "label"],
//           ],
//           order: [["state_name", "ASC"]],
//         }),
//         models.ApplicationStatus.findAll({
//           where: { is_active: true },
//           attributes: [
//             ["id", "value"],
//             ["status_name", "label"],
//           ],
//           order: [["status_name", "ASC"]],
//         }),
//       ]);

//       res.json({
//         success: true,
//         data: { roles, locations, states, statuses },
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

//   static async getAllFiltered(req, res, next) {
//     // Helper function to capitalize first letter of each word
//     const capitalizeWords = (str) => {
//       if (!str) return str;
//       return str
//         .toLowerCase()
//         .split(/(\s+|-)/)
//         .map((word, index, arr) => {
//           if (word.match(/^\s+|-/)) return word;
//           return word.charAt(0).toUpperCase() + word.slice(1);
//         })
//         .join("");
//     };

//     try {
//       const { state_id, location_id, role_id, page = 1, limit = 10 } = req.query;
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);

//       // Pagination setup
//       const pageNumber = parseInt(page) || 1;
//       const pageSize = parseInt(limit) || 10;
//       const offset = (pageNumber - 1) * pageSize;

//       // Build where conditions for the Job model
//       const jobWhereConditions = {
//         is_active: true,
//         is_approved: true,
//         end_date: {
//           [Op.gte]: today,
//         },
//       };

//       if (role_id) {
//         jobWhereConditions.role_id = parseInt(role_id);
//       }

//       // Build include options - simplified to avoid complex filtering
//       const includeOptions = [
//         {
//           model: models.CareerRoles,
//           as: "role",
//           attributes: ["role_name"],
//         },
//         {
//           model: models.CareerLocations,
//           as: "locations",
//           attributes: ["location_name"],
//           through: { attributes: [] },
//           include: [
//             {
//               model: models.Districts,
//               as: "district",
//               attributes: ["state_id"],
//               where: { is_active: true },
//               include: [
//                 {
//                   model: models.CareerStates,
//                   as: "state",
//                   attributes: ["id", "state_name"],
//                 },
//               ],
//             },
//           ],
//         },
//         {
//           model: models.CareerStates,
//           as: "states",
//           attributes: ["id", "state_name"],
//           through: { attributes: [] },
//         },
//       ];

//       // Handle filtering by adding WHERE conditions to the main query
//       let additionalWhereConditions = {};

//       // Filter by location if provided
//       if (location_id) {
//         additionalWhereConditions = {
//           ...additionalWhereConditions,
//           [Op.and]: [
//             ...(additionalWhereConditions[Op.and] || []),
//             sequelize.literal(`EXISTS (
//             SELECT 1 FROM job_locations jl
//             WHERE jl.job_id = "Jobs"."id"
//             AND jl.location_id = ${parseInt(location_id)}
//           )`),
//           ],
//         };
//       }

//       // Filter by state if provided
//       if (state_id) {
//         additionalWhereConditions = {
//           ...additionalWhereConditions,
//           [Op.and]: [
//             ...(additionalWhereConditions[Op.and] || []),
//             sequelize.literal(`EXISTS (
//             SELECT 1 FROM job_states js
//             WHERE js.job_id = "Jobs"."id"
//             AND js.state_id = ${parseInt(state_id)}
//           )`),
//           ],
//         };
//       }

//       // Combine where conditions
//       const finalWhereConditions = {
//         ...jobWhereConditions,
//         ...additionalWhereConditions,
//       };

//       const jobs = await Jobs.findAll({
//         where: finalWhereConditions,
//         attributes: {
//           include: [
//             [
//               sequelize.literal(`(
//               SELECT COUNT(*)
//               FROM job_applications AS ja
//               WHERE ja.job_id = "Jobs"."id"
//             )`),
//               "application_count",
//             ],
//           ],
//         },
//         include: includeOptions,
//         order: [
//           ["order", "ASC"],
//           ["id", "ASC"],
//         ],
//         limit: pageSize,
//         offset: offset,
//       });

//       // Get total count for pagination info - simplified count query
//       let countWhereConditions = { ...jobWhereConditions };

//       if (location_id) {
//         countWhereConditions = {
//           ...countWhereConditions,
//           [Op.and]: [
//             ...(countWhereConditions[Op.and] || []),
//             sequelize.literal(`EXISTS (
//             SELECT 1 FROM job_locations jl
//             WHERE jl.job_id = "Jobs"."id"
//             AND jl.location_id = ${parseInt(location_id)}
//           )`),
//           ],
//         };
//       }

//       if (state_id) {
//         countWhereConditions = {
//           ...countWhereConditions,
//           [Op.and]: [
//             ...(countWhereConditions[Op.and] || []),
//             sequelize.literal(`EXISTS (
//             SELECT 1 FROM job_states js
//             WHERE js.job_id = "Jobs"."id"
//             AND js.state_id = ${parseInt(state_id)}
//           )`),
//           ],
//         };
//       }

//       const totalCount = await Jobs.count({
//         where: countWhereConditions,
//       });

//       // Process jobs to format locations for multiple states (same logic as CareerPage)
//       const formattedJobs = jobs.map((job) => {
//         let locationDisplay = "";

//         if (job.states && job.states.length > 0) {
//           // Map locations to their respective states
//           const stateLocationMap = job.states.map((state) => {
//             // Filter locations for this state via district.state_id
//             const stateLocations = job.locations
//               .filter((loc) => loc.district && loc.district.state_id === state.id)
//               .map((loc) => capitalizeWords(loc.location_name))
//               .filter(Boolean);

//             if (job.is_display_full_locations) {
//               // Format: "Kerala: Calicut, Balussery and Chandra Nagar" or with ", etc."
//               if (stateLocations.length > 0) {
//                 const lastLocation = stateLocations.pop();
//                 const locationString =
//                   stateLocations.length > 0 ? `${stateLocations.join(", ")} and ${lastLocation}` : lastLocation;
//                 return `${capitalizeWords(state.state_name)}: ${locationString}${stateLocations.length + 1 > 3 ? ", etc." : ""}`;
//               }
//               return `${capitalizeWords(state.state_name)}: No Specific Locations`;
//             } else {
//               // Show "Multiple Locations" or "No Specific Locations"
//               return stateLocations.length > 0
//                 ? `${capitalizeWords(state.state_name)}: Multiple Locations`
//                 : `${capitalizeWords(state.state_name)}: No Specific Locations`;
//             }
//           });

//           // Join state-location strings with semicolons
//           locationDisplay = stateLocationMap.join("; ");
//         } else {
//           // Fallback if no states are associated
//           if (job.is_display_full_locations && job.locations.length > 0) {
//             const locations = job.locations.map((loc) => capitalizeWords(loc.location_name)).filter(Boolean);
//             const lastLocation = locations.pop();
//             const locationString = locations.length > 0 ? `${locations.join(", ")} and ${lastLocation}` : lastLocation;
//             locationDisplay = `Unknown State: ${locationString}${locations.length + 1 > 3 ? ", etc." : ""}`;
//           } else {
//             locationDisplay = `Unknown State: ${job.locations.length > 0 ? "Multiple Locations" : "No Specific Locations"}`;
//           }
//         }

//         return {
//           ...job.toJSON(), // Convert Sequelize instance to plain object
//           locationDisplay, // Add formatted location string
//         };
//       });

//       res.json({
//         success: true,
//         data: formattedJobs,
//         pagination: {
//           currentPage: pageNumber,
//           totalPages: Math.ceil(totalCount / pageSize),
//           totalItems: totalCount,
//           itemsPerPage: pageSize,
//           hasNextPage: pageNumber < Math.ceil(totalCount / pageSize),
//           hasPrevPage: pageNumber > 1,
//         },
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

//   static async getAll(req, res, next) {
//     try {
//       const { state_id, location_id, role_id, page = 1, limit = 10 } = req.query;

//       // Parse page and limit to integers
//       const pageNum = Math.max(1, parseInt(page, 10)); // Ensure at least page 1
//       const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10))); // Limit between 1 and 100
//       const offset = (pageNum - 1) * limitNum;

//       // Build where conditions for the Job model
//       const jobWhereConditions = {};

//       // Build include options for associations
//       const includeOptions = [
//         { model: models.CareerRoles, as: "role", attributes: ["role_name"] },
//         {
//           model: models.CareerLocations,
//           as: "locations",
//           attributes: ["id", "location_name", "district_id"],
//           through: { attributes: [] },
//           required: !!location_id,
//           where: location_id ? { id: parseInt(location_id) } : {},
//         },
//         {
//           model: models.CareerStates,
//           as: "states",
//           attributes: ["id", "state_name"],
//           through: { attributes: [] },
//           required: !!state_id,
//           where: state_id ? { id: parseInt(state_id) } : {},
//         },
//       ];

//       if (role_id) {
//         jobWhereConditions.role_id = parseInt(role_id);
//       }

//       // Fetch paginated jobs with total count
//       const { rows: jobs, count: totalItems } = await Jobs.findAndCountAll({
//         where: jobWhereConditions,
//         attributes: {
//           include: [
//             [
//               sequelize.literal(`(
//               SELECT COUNT(*)
//               FROM job_applications AS ja
//               WHERE ja.job_id = "Jobs"."id"
//             )`),
//               "application_count",
//             ],
//           ],
//         },
//         include: includeOptions,
//         order: [
//           ["order", "ASC"],
//           ["id", "ASC"],
//         ],
//         limit: limitNum,
//         offset,
//       });

//       const totalPages = Math.ceil(totalItems / limitNum);
//       const hasNextPage = pageNum < totalPages;
//       const hasPrevPage = pageNum > 1;

//       res.json({
//         success: true,
//         data: jobs,
//         pagination: {
//           currentPage: pageNum,
//           totalPages,
//           totalItems,
//           itemsPerPage: limitNum,
//           hasNextPage,
//           hasPrevPage,
//         },
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

//   static async getById(req, res, next) {
//     // Helper function to capitalize first letter of each word
//     const capitalizeWords = (str) => {
//       if (!str) return str;
//       return str
//         .toLowerCase()
//         .split(/(\s+|-)/)
//         .map((word, index, arr) => {
//           if (word.match(/^\s+|-/)) return word;
//           return word.charAt(0).toUpperCase() + word.slice(1);
//         })
//         .join("");
//     };

//     try {
//       const { id } = req.params;
//       const cacheKey = `job_${id}`;
//       const cachedData = await CacheService.get(cacheKey);

//       // if (cachedData) {
//       //   return res.json({ success: true, data: JSON.parse(cachedData) });
//       // }

//       const job = await Jobs.findByPk(id, {
//         include: [
//           { model: models.CareerRoles, as: "role", attributes: ["role_name"] },
//           {
//             model: models.CareerLocations,
//             as: "locations",
//             attributes: ["id", "location_name", "district_id"],
//             through: { attributes: [] },
//             include: [
//               {
//                 model: models.Districts,
//                 as: "district",
//                 attributes: ["state_id"],
//                 include: [
//                   {
//                     model: models.CareerStates,
//                     as: "state",
//                     attributes: ["id", "state_name"],
//                   },
//                 ],
//               },
//             ],
//           },
//           {
//             model: models.CareerStates,
//             as: "states",
//             attributes: ["id", "state_name"],
//             through: { attributes: [] },
//           },
//         ],
//       });

//       if (!job) {
//         throw new CustomError("Job not found", 404);
//       }

//       // Process job to format locations similar to getAllFiltered
//       let locationDisplay = "";
//       if (job.states && job.states.length > 0) {
//         // Map locations to their respective states
//         const stateLocationMap = job.states.map((state) => {
//           // Filter locations for this state via district.state_id
//           const stateLocations = job.locations
//             .filter((loc) => loc.district && loc.district.state_id === state.id)
//             .map((loc) => capitalizeWords(loc.location_name))
//             .filter(Boolean);

//           if (job.is_display_full_locations) {
//             // Format: "Kerala: Calicut, Balussery and Chandra Nagar" or with ", etc."
//             if (stateLocations.length > 0) {
//               const lastLocation = stateLocations.pop();
//               const locationString =
//                 stateLocations.length > 0 ? `${stateLocations.join(", ")} and ${lastLocation}` : lastLocation;
//               return `${capitalizeWords(state.state_name)}: ${locationString}${stateLocations.length + 1 > 3 ? ", etc." : ""}`;
//             }
//             return `${capitalizeWords(state.state_name)}: No Specific Locations`;
//           } else {
//             // Show "Multiple Locations" or "No Specific Locations"
//             return stateLocations.length > 0
//               ? `${capitalizeWords(state.state_name)}: Multiple Locations`
//               : `${capitalizeWords(state.state_name)}: No Specific Locations`;
//           }
//         });

//         // Join state-location strings with semicolons
//         locationDisplay = stateLocationMap.join("; ");
//       } else {
//         // Fallback if no states are associated
//         if (job.is_display_full_locations && job.locations.length > 0) {
//           const locations = job.locations.map((loc) => capitalizeWords(loc.location_name)).filter(Boolean);
//           const lastLocation = locations.pop();
//           const locationString = locations.length > 0 ? `${locations.join(", ")} and ${lastLocation}` : lastLocation;
//           locationDisplay = `Unknown State: ${locationString}${locations.length + 1 > 3 ? ", etc." : ""}`;
//         } else {
//           locationDisplay = `Unknown State: ${job.locations.length > 0 ? "Multiple Locations" : "No Specific Locations"}`;
//         }
//       }

//       const formattedJob = {
//         ...job.toJSON(), // Convert Sequelize instance to plain object
//         locationDisplay, // Add formatted location string
//       };

//       await CacheService.set(cacheKey, JSON.stringify(formattedJob), 3600);
//       res.json({ success: true, data: formattedJob });
//     } catch (error) {
//       next(error);
//     }
//   }

//   static async update(req, res, next) {
//     try {
//       const { id } = req.params;
//       const job = await Jobs.findByPk(id);
//       if (!job) {
//         throw new CustomError("Job not found", 404);
//       }

//       const {
//         role_id,
//         job_title,
//         job_description,
//         experience,
//         is_active,
//         is_approved,
//         end_date,
//         order,
//         reapply_period_months,
//         location_ids,
//         state_ids,
//         is_display_full_locations,
//       } = req.body;

//       // Validate existence of locations and states if provided
//       if (location_ids) {
//         if (!Array.isArray(location_ids) || location_ids.length === 0) {
//           throw new CustomError("At least one location is required", 400);
//         }
//         const existingLocations = await models.CareerLocations.findAll({ where: { id: location_ids } });
//         if (existingLocations.length !== location_ids.length) {
//           throw new CustomError("One or more locations not found", 404);
//         }
//       }
//       if (state_ids) {
//         if (!Array.isArray(state_ids) || state_ids.length === 0) {
//           throw new CustomError("At least one state is required", 400);
//         }
//         const existingStates = await models.CareerStates.findAll({ where: { id: state_ids } });
//         if (existingStates.length !== state_ids.length) {
//           throw new CustomError("One or more states not found", 404);
//         }
//       }

//       const updateData = {
//         role_id,
//         job_title,
//         job_description,
//         experience,
//         is_active,
//         is_approved,
//         end_date: end_date ? new Date(end_date) : null,
//         order,
//         reapply_period_months,
//         is_display_full_locations,
//       };

//       if (updateData.end_date && isNaN(updateData.end_date.getTime())) {
//         throw new CustomError("Invalid end_date format", 400);
//       }

//       await job.update(updateData);

//       // Update associations if provided
//       if (location_ids) {
//         await job.setLocations(location_ids);
//       }
//       if (state_ids) {
//         await job.setStates(state_ids);
//       }

//       // Invalidate caches after update
//       await Promise.all([
//         CacheService.invalidate("jobs"),
//         CacheService.invalidate("webCareerPage"),
//         CacheService.invalidate(`job_${id}`),
//       ]);
//       res.json({ success: true, data: job, message: "Job updated" });
//     } catch (error) {
//       next(error);
//     }
//   }

//   static async delete(req, res, next) {
//     try {
//       const { id } = req.params;
//       const job = await Jobs.findByPk(id);
//       if (!job) {
//         throw new CustomError("Job not found", 404);
//       }

//       await job.destroy();

//       // Invalidate caches after deletion
//       await Promise.all([
//         CacheService.invalidate("jobs"),
//         CacheService.invalidate("webCareerPage"),
//         CacheService.invalidate(`job_${id}`),
//       ]);
//       res.json({ success: true, message: "Job deleted", data: id });
//     } catch (error) {
//       next(error);
//     }
//   }

//   static async updateOrder(req, res, next) {
//     try {
//       // Expect: req.body.jobs = [{ id: 1, order: 1 }, ...]
//       const { jobs } = req.body;
//       if (!Array.isArray(jobs) || jobs.length === 0) {
//         throw new CustomError("No job order data provided", 400);
//       }

//       // Validate all jobs exist
//       const jobIds = jobs.map((j) => j.id);
//       const foundJobs = await Jobs.findAll({ where: { id: jobIds } });
//       if (foundJobs.length !== jobs.length) {
//         throw new CustomError("Some jobs not found", 404);
//       }

//       // Update order in a transaction
//       await Jobs.sequelize.transaction(async (t) => {
//         for (const { id, order } of jobs) {
//           await Jobs.update({ order }, { where: { id }, transaction: t });
//         }
//       });

//       // Invalidate cache
//       await Promise.all([CacheService.invalidate("jobs"), CacheService.invalidate("webCareerPage")]);

//       res.json({ success: true, message: "Order updated successfully" });
//     } catch (error) {
//       next(error);
//     }
//   }
// }

// module.exports = JobsController;
