const { default: axios } = require("axios");
const { models } = require("../../models/index");
const CacheService = require("../../services/cacheService");
const { sendOtpEmail, careerMail } = require("../../services/emailService");
const CustomError = require("../../utils/customError");
const crypto = require("crypto");
const ExcelJS = require("exceljs");
const { Op } = require("sequelize");
const dayjs = require("dayjs");
const capitalizeFirstLetter = require("../../utils/helperFunctions");
class JobApplicationSubmissionController {
  // Generate and send OTP
  static async sendOtp(req, res, next) {
    try {
      const { email } = req.body;
      if (!email) throw new CustomError("Email is required", 400);

      // Generate 6-digit OTP
      const otp = crypto.randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Delete existing OTPs for this email
      await models.Otp.destroy({ where: { email } });

      // Save OTP
      await models.Otp.create({ email, otp, expires_at: expiresAt });

      // Send OTP email
      await sendOtpEmail(email, otp);

      res.status(200).json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
      next(error);
    }
  }

  // Verify OTP and return applicant data if exists
  static async verifyOtp(req, res, next) {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) throw new CustomError("Email and OTP are required", 400);

      const otpRecord = await models.Otp.findOne({ where: { email, otp } });
      if (!otpRecord) throw new CustomError("Invalid OTP", 400);
      if (new Date() > otpRecord.expires_at) {
        await otpRecord.destroy();
        throw new CustomError("OTP expired", 400);
      }

      // Delete OTP after successful verification
      await otpRecord.destroy();

      // Fetch applicant data if exists
      const applicant = await models.Applicants.findOne({
        where: { email },
        attributes: [
          "id",
          "name",
          "email",
          "phone",
          "referred_employee_name",
          "employee_referral_code",
          "age",
          "current_salary",
          "expected_salary",
          "file",
        ],
      });

      let modifiedData = null;

      if (applicant) {
        const preferred_role = await models.GeneralApplications.findOne({
          where: { applicant_id: applicant?.id },
          attributes: ["role_id"],
        });

        modifiedData = {
          ...applicant?.toJSON(),
          preferred_role: preferred_role?.role_id,
        };
      }

      res.status(200).json({
        success: true,
        data: modifiedData || null,
        message: modifiedData ? "Applicant data retrieved" : "No applicant data found",
      });
    } catch (error) {
      next(error);
    }
  }

  static async submitApplication(req, res, next) {
    try {
      const { applicant, job_application, recaptcha } = req.body;
      const file = req.file;

      // Validate reCAPTCHA token (bypass in development)
      if (process.env.NODE_ENV !== "development") {
        if (!recaptcha) {
          return res.status(400).json({ success: false, message: "reCAPTCHA token is missing" });
        }

        const recaptchaResponse = await axios.post(
          "https://www.google.com/recaptcha/api/siteverify",
          new URLSearchParams({
            secret: process.env.RECAPTCHA_SECRET_KEY,
            response: recaptcha,
          }).toString(),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          },
        );

        console.log("recaptchaResponse.data:", recaptchaResponse.data);

        const { success, score } = recaptchaResponse.data;

        if (!success || score < 0.5) {
          // Adjust score threshold as needed (0.5 is a common threshold for v3)
          return res.status(400).json({
            success: false,
            message: "reCAPTCHA verification failed. Please try again.",
          });
        }
      } else {
        console.log("reCAPTCHA verification bypassed in development mode");
      }

      // Validate preferred locations (can be single or multiple)
      let preferredLocations = [];

      if (applicant?.preferred_locations && Array.isArray(applicant.preferred_locations)) {
        // Multiple locations provided
        preferredLocations = applicant.preferred_locations;
      }

      // Validate preferred states (optional)
      let preferredStates = [];

      if (applicant?.preferred_states && Array.isArray(applicant.preferred_states)) {
        preferredStates = applicant.preferred_states;
      }

      let preferredDistrictId = null;
      if (applicant?.preferred_districts && Array.isArray(applicant.preferred_districts)) {
        preferredDistrictId = applicant.preferred_districts[0];
      }

      console.log("✅ All locations validated successfully");

      // Validate all states exist (if provided)
      if (preferredStates.length > 0) {
        const states = await models.CareerStates.findAll({
          where: { id: { [Op.in]: preferredStates } },
        });

        console.log(`Found ${states.length} states out of ${preferredStates.length} requested`);
        states.forEach((state) => {
          console.log(`  - ID: ${state.id}, Name: ${state.state_name}`);
        });

        if (states.length !== preferredStates.length) {
          const foundIds = states.map((s) => s.id);
          const missingIds = preferredStates.filter((id) => !foundIds.includes(id));
          console.log("❌ Missing state IDs:", missingIds);
          throw new CustomError("One or more preferred states not found", 404);
        }

        console.log("✅ All states validated successfully");
      }

      // Validate job
      const job = await models.CareerJobs.findByPk(job_application?.job_id);
      if (!job) throw new CustomError("Job not found", 404);

      // Fetch "Pending" status
      const pendingStatus = await models.ApplicationStatus.findOne({
        where: { status_name: "Pending" },
      });
      if (!pendingStatus) throw new CustomError("Pending status not found", 500);

      // Check if applicant with this email already exists
      let existingApplicant = await models.Applicants.findOne({
        where: { email: applicant?.email },
      });

      let applicantRecord;
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      if (existingApplicant) {
        // Get reapplication period from job, default to 6 months if not set
        const reapplyPeriodMonths = job.reapply_period_months ?? 6;
        const reapplyThreshold = new Date();
        reapplyThreshold.setMonth(reapplyThreshold.getMonth() - reapplyPeriodMonths);

        // Check for existing application for this job within reapply period
        const existingApplication = await models.JobApplications.findOne({
          where: {
            applicant_id: existingApplicant.id,
            job_id: job_application?.job_id,
            created_at: {
              [Op.gte]: reapplyThreshold,
            },
          },
        });

        // Optimized version - minimal calculations and conversions
        // Optimized version - returns remaining time in months
        if (existingApplication) {
          // Get current IST date string in YYYY-MM-DD format
          const todayISTString = new Date().toLocaleDateString("en-CA", {
            timeZone: "Asia/Kolkata",
          });

          // Convert created_at to IST date string in YYYY-MM-DD format
          const createdAtISTString = existingApplication.created_at.toLocaleDateString("en-CA", {
            timeZone: "Asia/Kolkata",
          });

          // Parse to Date objects (automatically at midnight)
          const todayIST = new Date(todayISTString);
          const createdAtIST = new Date(createdAtISTString);

          // Add months directly to created date
          const reapplyDate = new Date(createdAtIST);
          reapplyDate.setMonth(reapplyDate.getMonth() + reapplyPeriodMonths);

          // Simple comparison
          if (todayIST < reapplyDate) {
            // Calculate remaining months and days
            const yearDiff = reapplyDate.getFullYear() - todayIST.getFullYear();
            const monthDiff = reapplyDate.getMonth() - todayIST.getMonth();
            const dayDiff = reapplyDate.getDate() - todayIST.getDate();

            let remainingMonths = yearDiff * 12 + monthDiff;

            // If we haven't reached the day yet in the current month, subtract 1
            if (dayDiff < 0) {
              remainingMonths--;
            }

            // Format message based on remaining time
            let waitMessage;
            if (remainingMonths > 0) {
              const remainingDays = Math.ceil((reapplyDate - todayIST) / 86400000);
              const daysInCurrentMonth = remainingDays - remainingMonths * 30; // approximate

              if (remainingMonths === 1 && daysInCurrentMonth <= 7) {
                waitMessage = `about 1 month`;
              } else if (remainingMonths > 1) {
                waitMessage = `${remainingMonths} months`;
              } else {
                waitMessage = `about 1 month`;
              }
            } else {
              // Less than a month remaining - show in days
              const daysRemaining = Math.ceil((reapplyDate - todayIST) / 86400000);
              waitMessage = `${daysRemaining} days`;
            }

            throw new CustomError(`Already submitted. Please wait ${waitMessage} before reapplying.`, 409);
          }
        }
        // Prepare update data
        const updateData = { ...applicant };
        if (file) {
          updateData.file = file.path;
          updateData.file_uploaded_at = new Date();
        }

        // Remove preferred_locations and preferred_states from updateData as they will be handled separately
        preferredLocations?.length > 0 && delete updateData.preferred_locations;
        delete updateData.preferred_states;

        // Update applicant
        await existingApplicant.update(updateData);

        // Update preferred locations
        await models.ApplicantLocations.destroy({
          where: { applicant_id: existingApplicant.id },
        });

        if (preferredLocations.length > 0) {
          // Add new preferred locations
          const locationData = preferredLocations.map((locationId, index) => ({
            applicant_id: existingApplicant.id,
            location_id: locationId,
            is_primary: index === 0, // First location is primary
          }));

          await models.ApplicantLocations.bulkCreate(locationData);
        }

        // Update preferred states
        await models.ApplicantStates.destroy({
          where: { applicant_id: existingApplicant.id },
        });

        // Add new preferred states
        if (preferredStates.length > 0) {
          const stateData = preferredStates.map((stateId, index) => ({
            applicant_id: existingApplicant.id,
            state_id: stateId,
            is_primary: index === 0, // First state is primary
          }));

          await models.ApplicantStates.bulkCreate(stateData);
        }

        await models.ApplicantDistricts.destroy({
          where: { applicant_id: existingApplicant.id },
        });

        await models?.ApplicantDistricts?.create({
          applicant_id: existingApplicant.id,
          district_id: preferredDistrictId,
          is_primary: true,
          created_at: new Date(),
        });

        applicantRecord = existingApplicant;
      } else {
        // Prepare create data
        const createData = {
          ...applicant,
          file: file ? file.path : null,
          file_uploaded_at: file ? new Date() : null,
        };

        // Remove preferred_locations and preferred_states from createData as they will be handled separately
        preferredLocations?.length > 0 && delete createData.preferred_locations;
        delete createData.preferred_states;

        applicantRecord = await models.Applicants.create(createData);

        // Add preferred locations
        const locationData = preferredLocations.map((locationId, index) => ({
          applicant_id: applicantRecord.id,
          location_id: locationId,
          is_primary: index === 0, // First location is primary
        }));

        await models.ApplicantLocations.bulkCreate(locationData);

        // Add preferred states
        if (preferredStates.length > 0) {
          const stateData = preferredStates.map((stateId, index) => ({
            applicant_id: applicantRecord.id,
            state_id: stateId,
            is_primary: index === 0, // First state is primary
          }));

          await models.ApplicantStates.bulkCreate(stateData);
        }
        await models?.ApplicantDistricts?.create({
          applicant_id: applicantRecord.id,
          district_id: preferredDistrictId,
          is_primary: true,
          created_at: new Date(),
        });
      }

      // Create job application record
      const applicationData = {
        job_id: job_application?.job_id,
        applicant_id: applicantRecord.id,
        status_id: pendingStatus.id,
        is_active: job_application?.is_active ?? true,
        order: job_application?.order ?? 1,
      };
      const newApplication = await models.JobApplications.create(applicationData);

      careerMail(applicantRecord.email, applicantRecord.name);
      // Invalidate caches
      await Promise.all([CacheService.invalidate("applicants"), CacheService.invalidate("job_applications")]);

      // Fetch applicant with preferred locations and states for response
      const applicantWithLocations = await models.Applicants.findByPk(applicantRecord.id, {
        include: [
          {
            model: models.CareerLocations,
            through: models.ApplicantLocations,
            as: "preferredLocations",
            attributes: ["id", "location_name"],
          },
          {
            model: models.CareerStates,
            through: models.ApplicantStates,
            as: "preferredStates",
            attributes: ["id", "state_name"],
          },
        ],
      });

      res.status(201).json({
        success: true,
        data: {
          applicant: applicantWithLocations,
          job_application: newApplication,
        },
        message: "Job application submitted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async listApplications(req, res, next) {
    try {
      const {
        role_id,
        location_id,
        state_id,
        status_id,
        applicant_location_id,
        applicant_state_id,
        limit = "10",
        offset = "0",
        from_date,
        to_date,
      } = req.query;

      const parsedLimit = Math.max(1, parseInt(limit, 10) || 10); // Ensure limit >= 1
      const parsedOffset = Math.max(0, parseInt(offset, 10) || 0); // Ensure offset >= 0

      // Build cache key based on query parameters
      const cacheKey = `job_applications_all_${role_id || "all"}_${location_id || "all"}_${state_id || "all"}_${status_id || "all"}_${
        applicant_location_id || "all"
      }_${applicant_state_id || "all"}_${parsedLimit}_${parsedOffset}`;
      const cachedData = await CacheService.get(cacheKey);

      // if (cachedData) {
      //   return res.json({
      //     success: true,
      //     data: JSON.parse(cachedData),
      //   });
      // }

      // Build filter conditions
      const whereConditions = {}; // Main conditions for JobApplications
      const jobWhere = {};
      const applicantWhere = {};

      if (status_id) {
        whereConditions.status_id = parseInt(status_id);
      }

      if (role_id) {
        jobWhere.role_id = parseInt(role_id);
      }

      if (applicant_location_id) {
        // Filter by preferred locations only (many-to-many relationship)
        applicantWhere.id = {
          [Op.in]: require("sequelize").literal(`(
            SELECT applicant_id 
            FROM "applicant_locations" 
            WHERE location_id = ${parseInt(applicant_location_id)}
          )`),
        };
      }

      if (applicant_state_id) {
        // Filter by applicant's preferred states only (many-to-many relationship)
        applicantWhere.id = {
          [Op.in]: require("sequelize").literal(`(
            SELECT applicant_id 
            FROM "applicant_states" 
            WHERE state_id = ${parseInt(applicant_state_id)}
          )`),
        };
      }

      // Handle combined filtering for both location and state
      if (applicant_location_id && applicant_state_id) {
        applicantWhere.id = {
          [Op.in]: require("sequelize").literal(`(
            SELECT DISTINCT al.applicant_id 
            FROM "applicant_locations" al
            INNER JOIN "applicant_states" ast ON al.applicant_id = ast.applicant_id
            WHERE al.location_id = ${parseInt(applicant_location_id)}
            AND ast.state_id = ${parseInt(applicant_state_id)}
          )`),
        };
      }

      if (from_date && to_date) {
        whereConditions.application_date = {
          [Op.between]: [new Date(from_date), new Date(to_date)],
        };
      } else if (from_date) {
        whereConditions.application_date = {
          [Op.gte]: new Date(from_date),
        };
      } else if (to_date) {
        whereConditions.application_date = {
          [Op.lte]: new Date(to_date),
        };
      }

      // Build location and state filters for many-to-many relationships
      const jobInclude = [
        {
          model: models.CareerRoles,
          as: "role",
          attributes: ["id", "role_name"],
        },
        {
          model: models.CareerLocations,
          as: "locations",
          attributes: ["id", "location_name"],
          through: { attributes: [] }, // Exclude join table attributes
          ...(location_id && {
            where: { id: parseInt(location_id) },
          }),
        },
        {
          model: models.CareerStates,
          as: "states",
          attributes: ["id", "state_name"],
          through: { attributes: [] }, // Exclude join table attributes
          ...(state_id && {
            where: { id: parseInt(state_id) },
          }),
        },
      ];

      // Simplified include array to avoid memory issues
      const includeArray = [
        {
          model: models.Applicants,
          as: "applicant",
          attributes: ["id", "name", "email", "phone", "file"],
          ...(Object.keys(applicantWhere).length > 0 && { where: applicantWhere }),
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
        },
        {
          model: models.CareerJobs,
          as: "job",
          // Keep the job title visible on existing applications after a job is soft-deleted.
          paranoid: false,
          attributes: ["id", "job_title", "role_id"],
          ...(Object.keys(jobWhere).length > 0 && { where: jobWhere }),
          include: [
            {
              model: models.CareerRoles,
              as: "role",
              attributes: ["id", "role_name"],
              required: false,
            },
          ],
        },
        {
          model: models.ApplicationStatus,
          as: "status",
          attributes: ["id", "status_name"],
        },
      ];

      // Use findAndCountAll with distinct: true to ensure count and data query use identical where/include logic
      // This fixes the pagination bug where filtered count was being computed without the association filters
      const { rows: applications, count: total } = await models.JobApplications.findAndCountAll({
        where: whereConditions,
        include: includeArray,
        order: [["application_date", "DESC"]],
        limit: parsedLimit,
        offset: parsedOffset,
        distinct: true, // Required to count correctly when there are many-to-many or hasMany joins, otherwise join rows get double-counted
        raw: false, // Ensure we get full objects
      });

      // Transform applications to include all required fields
      const transformedApplications = applications.map((app) => {
        const plain = app.toJSON();

        // Get preferred location (primary or first)
        const preferredLocations = plain?.applicant?.preferredLocations || [];
        const primaryLocation = preferredLocations.find((loc) => loc?.ApplicantLocations?.is_primary) || preferredLocations[0];
        const preferredLocationName = primaryLocation?.location_name || null;

        // Get preferred state (primary or first)
        const preferredStates = plain?.applicant?.preferredStates || [];
        const primaryState = preferredStates.find((state) => state?.ApplicantStates?.is_primary) || preferredStates[0];
        const preferredStateName = primaryState?.state_name || null;

        // Format application date
        const applicationDate = plain.application_date ? new Date(plain.application_date).toLocaleDateString("en-GB") : null;

        // Return only the transformed fields, no nested job object
        return {
          id: plain.id,
          applicant_name: plain.applicant?.name || null,
          applicant_email: plain.applicant?.email || null,
          job_title: plain.job?.job_title || null,
          role: plain.job?.role?.role_name || null,
          preferred_location: preferredLocationName,
          preferred_state: preferredStateName,
          application_date: applicationDate,
          status: plain.status?.status_name || null,
          resume: plain.applicant?.file ? `Resume_${plain.applicant.name}_${plain.id}` : null,
          applicant: {
            id: plain.applicant?.id,
            name: plain.applicant?.name,
            email: plain.applicant?.email,
            phone: plain.applicant?.phone,
            file: plain.applicant?.file,
            preferred_location: preferredLocationName,
            preferred_state: preferredStateName,
          },
          status: {
            id: plain.status?.id,
            status_name: plain.status?.status_name,
          },
        };
      });

      const response = {
        success: true,
        data: transformedApplications,
        total,
        pagination: {
          page: Math.floor(parsedOffset / parsedLimit) + 1,
          totalPages: Math.ceil(total / parsedLimit),
          limit: parsedLimit,
          offset: parsedOffset,
          hasNextPage: Math.floor(parsedOffset / parsedLimit) + 1 < Math.ceil(total / parsedLimit),
          hasPrevPage: Math.floor(parsedOffset / parsedLimit) + 1 > 1,
        },
      };

      // Store in cache for 1 hour
      await CacheService.set(cacheKey, JSON.stringify(response), 3600); // Cache for 1 hour

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async submitGeneralApplication(req, res, next) {
    try {
      const { applicant, general_application, recaptcha } = req.body;
      const file = req?.file;
      // Validate reCAPTCHA token (bypass in development)
      if (process.env.NODE_ENV !== "development") {
        if (!recaptcha) {
          return res.status(400).json({ success: false, message: "reCAPTCHA token is missing" });
        }

        const recaptchaResponse = await axios.post(
          "https://www.google.com/recaptcha/api/siteverify",
          new URLSearchParams({
            secret: process.env.RECAPTCHA_SECRET_KEY,
            response: recaptcha,
          }).toString(),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          },
        );

        console.log("recaptchaResponse.data:", recaptchaResponse.data);

        const { success, score } = recaptchaResponse.data;

        if (!success || score < 0.5) {
          // Adjust score threshold as needed (0.5 is a common threshold for v3)
          return res.status(400).json({
            success: false,
            message: "reCAPTCHA verification failed. Please try again.",
          });
        }
      } else {
        console.log("reCAPTCHA verification bypassed in development mode");
      }

      // Validate preferred locations (can be single or multiple)
      let preferredLocations = [];
      if (applicant?.preferred_locations && Array.isArray(applicant.preferred_locations)) {
        // Multiple locations provided
        preferredLocations = applicant.preferred_locations;
      }

      // Validate preferred states (optional)
      let preferredStates = [];

      if (applicant?.preferred_states && Array.isArray(applicant.preferred_states)) {
        preferredStates = applicant.preferred_states;
      }

      let preferredDistrictId = null;
      if (applicant?.preferred_districts && Array.isArray(applicant.preferred_districts)) {
        preferredDistrictId = applicant.preferred_districts[0];
      }

      // Validate all states exist (if provided)
      if (preferredStates.length > 0) {
        const states = await models.CareerStates.findAll({
          where: { id: { [Op.in]: preferredStates } },
        });

        if (states.length !== preferredStates.length) {
          throw new CustomError("One or more preferred states not found", 404);
        }
      }

      // Validate role
      const role = await models.CareerRoles.findByPk(general_application?.role_id);
      if (!role) throw new CustomError("Role not found", 404);

      const pendingStatus = await models.ApplicationStatus.findOne({
        where: { status_name: "Pending" },
      });
      if (!pendingStatus) throw new CustomError("Pending status not found", 500);

      let applicantRecord = await models.Applicants.findOne({
        where: { email: applicant?.email },
      });

      // Check if file is expired
      const isFileExpired = (record) => {
        if (!record?.file || !record.file_uploaded_at) return true;
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return new Date(record.file_uploaded_at) < sixMonthsAgo;
      };

      if (!applicantRecord && !file) {
        throw new CustomError("Resume file is required for new applicants", 400);
      }

      if (applicantRecord) {
        // Check if any general application exists
        const existingApplication = await models.GeneralApplications.findOne({
          where: { applicant_id: applicantRecord?.id },
        });

        // Prepare updated data
        const updatedData = {
          ...applicant,
        };

        // Remove preferred_locations and preferred_states from updateData as they will be handled separately
        preferredLocations?.length > 0 && delete updatedData.preferred_locations;
        delete updatedData.preferred_states;

        // Handle file logic:
        if (file) {
          // New file uploaded: update both fields
          updatedData.file = file.path;
          updatedData.file_uploaded_at = new Date();
        } else if (isFileExpired(applicantRecord)) {
          // No new file, but existing file is expired: clear fields
          updatedData.file = null;
          updatedData.file_uploaded_at = null;
        }
        // If no new file and file is not expired, keep existing fields

        await applicantRecord.update(updatedData);

        // Update preferred locations
        await models.ApplicantLocations.destroy({
          where: { applicant_id: applicantRecord.id },
        });

        if (preferredLocations.length > 0) {
          // Create new preferred locations
          const locationInserts = preferredLocations.map((locationId, index) => ({
            applicant_id: applicantRecord.id,
            location_id: locationId,
            is_primary: index === 0, // First location is primary
            created_at: new Date(),
            updated_at: new Date(),
          }));

          await models.ApplicantLocations.bulkCreate(locationInserts);
        }

        // Update preferred states
        await models.ApplicantStates.destroy({
          where: { applicant_id: applicantRecord.id },
        });

        // Add new preferred states
        if (preferredStates.length > 0) {
          const stateInserts = preferredStates.map((stateId, index) => ({
            applicant_id: applicantRecord.id,
            state_id: stateId,
            is_primary: index === 0, // First state is primary
            created_at: new Date(),
          }));

          await models.ApplicantStates.bulkCreate(stateInserts);
        }

        await models.ApplicantDistricts.destroy({
          where: { applicant_id: applicantRecord.id },
        });

        await models?.ApplicantDistricts?.create({
          applicant_id: applicantRecord.id,
          district_id: preferredDistrictId,
          is_primary: true,
          created_at: new Date(),
        });

        // If application exists, return response
        if (existingApplication) {
          // Fetch applicant with preferred locations and states for response
          const applicantWithLocations = await models.Applicants.findByPk(applicantRecord.id, {
            include: [
              {
                model: models.CareerLocations,
                through: {
                  model: models.ApplicantLocations,
                  attributes: ["is_primary"],
                },
                as: "preferredLocations",
                attributes: ["id", "location_name"],
              },
              {
                model: models.CareerStates,
                through: {
                  model: models.ApplicantStates,
                  attributes: ["is_primary"],
                },
                as: "preferredStates",
                attributes: ["id", "state_name"],
              },
              {
                model: models.ApplicantDistricts,
                as: "preferredDistricts",
                attributes: ["id", "district_id"],
                include: [
                  {
                    model: models.Districts,
                    as: "district",
                    attributes: ["id", "district_name"],
                  },
                ],
              },
            ],
          });

          return res.status(200).json({
            success: true,
            data: {
              applicant: applicantWithLocations,
              general_application: existingApplication,
            },
            message: "Application already exists. Details have been updated.",
          });
        }
      } else {
        // Create new applicant
        const newApplicantData = {
          ...applicant,
          file: file ? file.path : null,
          file_uploaded_at: file ? new Date() : null,
        };

        // Remove preferred_locations and preferred_states from newApplicantData as they will be handled separately
        preferredLocations?.length > 0 && delete newApplicantData.preferred_locations;
        delete newApplicantData.preferred_states;

        applicantRecord = await models.Applicants.create(newApplicantData);

        if (preferredLocations.length > 0) {
          // Create new preferred locations
          const locationInserts = preferredLocations.map((locationId, index) => ({
            applicant_id: applicantRecord.id,
            location_id: locationId,
            is_primary: index === 0, // First location is primary
            created_at: new Date(),
            updated_at: new Date(),
          }));

          await models.ApplicantLocations.bulkCreate(locationInserts);
        }

        // Create preferred states
        if (preferredStates.length > 0) {
          const stateInserts = preferredStates.map((stateId, index) => ({
            applicant_id: applicantRecord.id,
            state_id: stateId,
            is_primary: index === 0, // First state is primary
            created_at: new Date(),
          }));

          await models.ApplicantStates.bulkCreate(stateInserts);
        }
      }

      // Create the general application
      const newApplication = await models.GeneralApplications.create({
        applicant_id: applicantRecord.id,
        status_id: pendingStatus.id,
        role_id: general_application?.role_id,
        preferred_role_name: general_application?.preferred_role_name,
      });

      careerMail(applicant.email, applicant.name);

      // Invalidate caches
      await Promise.all([CacheService.invalidate("applicants"), CacheService.invalidate("general_applications")]);

      res.status(201).json({
        success: true,
        data: {},
        message: "General application submitted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async listGeneralApplications(req, res, next) {
    try {
      const {
        role_id,
        location_id,
        status_id,
        applicant_location_id,
        applicant_state_id,
        from_date,
        to_date,
        limit = "10",
        offset = "0",
      } = req.query;

      const parsedLimit = Math.max(1, parseInt(limit, 10) || 10); // Ensure limit >= 1
      const parsedOffset = Math.max(0, parseInt(offset, 10) || 0); // Ensure offset >= 0

      // Build cache key based on query parameters
      const cacheKey = `general_applications_all_${role_id || "all"}_${location_id || "all"}_${status_id || "all"}_${
        applicant_location_id || "all"
      }_${applicant_state_id || "all"}_${parsedLimit}_${parsedOffset}`;
      const cachedData = await CacheService.get(cacheKey);

      // if (cachedData) {
      //   return res.json({
      //     success: true,
      //     data: JSON.parse(cachedData),
      //   });
      // }

      // Build filter conditions
      const whereConditions = {};
      const applicantWhere = {};

      if (status_id) {
        whereConditions.status_id = parseInt(status_id);
      }

      if (role_id) {
        whereConditions.role_id = parseInt(role_id);
      }

      if (location_id) {
        // Filter by preferred locations only (many-to-many relationship)
        applicantWhere.id = {
          [Op.in]: require("sequelize").literal(`(
            SELECT applicant_id 
            FROM "applicant_locations" 
            WHERE location_id = ${parseInt(location_id)}
          )`),
        };
      }

      if (applicant_location_id) {
        // Filter by applicant's preferred locations only (many-to-many relationship)
        applicantWhere.id = {
          [Op.in]: require("sequelize").literal(`(
            SELECT applicant_id 
            FROM "applicant_locations" 
            WHERE location_id = ${parseInt(applicant_location_id)}
          )`),
        };
      }

      if (applicant_state_id) {
        // Filter by applicant's preferred states only (many-to-many relationship)
        applicantWhere.id = {
          [Op.in]: require("sequelize").literal(`(
            SELECT applicant_id 
            FROM "applicant_states" 
            WHERE state_id = ${parseInt(applicant_state_id)}
          )`),
        };
      }

      // Handle combined filtering for both location and state
      if (applicant_location_id && applicant_state_id) {
        applicantWhere.id = {
          [Op.in]: require("sequelize").literal(`(
            SELECT DISTINCT al.applicant_id 
            FROM "applicant_locations" al
            INNER JOIN "applicant_states" ast ON al.applicant_id = ast.applicant_id
            WHERE al.location_id = ${parseInt(applicant_location_id)}
            AND ast.state_id = ${parseInt(applicant_state_id)}
          )`),
        };
      }

      if (from_date && to_date) {
        whereConditions.application_date = {
          [Op.between]: [new Date(from_date), new Date(to_date)],
        };
      } else if (from_date) {
        whereConditions.application_date = {
          [Op.gte]: new Date(from_date),
        };
      } else if (to_date) {
        whereConditions.application_date = {
          [Op.lte]: new Date(to_date),
        };
      }

      const { rows: applications, count: total } = await models.GeneralApplications.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: models.Applicants,
            as: "applicant",
            attributes: ["id", "name", "email", "phone", "file"],
            where: applicantWhere,
            required: !!(location_id || applicant_location_id || applicant_state_id), // Make Applicants join required if any applicant filtering is provided
            include: [
              {
                model: models.CareerLocations,
                as: "preferredLocations",
                through: {
                  model: models.ApplicantLocations,
                  attributes: ["is_primary"],
                },
                attributes: ["id", "location_name"],
                required: !!location_id, // Make join required if location_id is provided
              },
              {
                model: models.CareerStates,
                as: "preferredStates",
                through: {
                  model: models.ApplicantStates,
                  attributes: ["is_primary"],
                },
                attributes: ["id", "state_name"],
                required: false, // Always optional to avoid affecting count
              },
            ],
          },
          {
            model: models.CareerRoles,
            as: "role",
            attributes: ["id", "role_name"],
          },
          {
            model: models.ApplicationStatus,
            as: "status",
            attributes: ["id", "status_name"],
          },
        ],
        order: [["application_date", "DESC"]],
        limit: parsedLimit,
        offset: parsedOffset,
        distinct: true, // Add distinct to handle potential duplicates from joins
      });

      // Transform general applications to include all required fields
      const transformedGeneralApplications = applications.map((app) => {
        const plain = app.toJSON();

        // Get preferred location (primary or first)
        const preferredLocations = plain?.applicant?.preferredLocations || [];
        const primaryLocation = preferredLocations.find((loc) => loc?.ApplicantLocations?.is_primary) || preferredLocations[0];
        const preferredLocationName = primaryLocation?.location_name || null;

        // Get preferred state (primary or first)
        const preferredStates = plain?.applicant?.preferredStates || [];
        const primaryState = preferredStates.find((state) => state?.ApplicantStates?.is_primary) || preferredStates[0];
        const preferredStateName = primaryState?.state_name || null;

        // Format application date
        const applicationDate = plain.application_date ? new Date(plain.application_date).toLocaleDateString("en-GB") : null;

        // Create clean response object with all required fields
        return {
          id: plain.id,
          applicant_name: plain.applicant?.name || null,
          applicant_email: plain.applicant?.email || null,
          job_title: plain.preferred_role_name || null, // For general applications, use preferred_role_name
          role: plain.role?.role_name || null,
          preferred_location: preferredLocationName,
          preferred_state: preferredStateName,
          application_date: applicationDate,
          status: plain.status?.status_name || null,
          resume: plain.applicant?.file ? `Resume_${plain.applicant.name}_${plain.id}` : null,
          applicant: {
            id: plain.applicant?.id,
            name: plain.applicant?.name,
            email: plain.applicant?.email,
            phone: plain.applicant?.phone,
            file: plain.applicant?.file,
            preferred_location: preferredLocationName,
            preferred_state: preferredStateName,
          },
          status: {
            id: plain.status?.id,
            status_name: plain.status?.status_name,
          },
        };
      });

      const response = {
        success: true,
        data: transformedGeneralApplications,
        total,
        pagination: {
          page: Math.floor(parsedOffset / parsedLimit) + 1,
          totalPages: Math.ceil(total / parsedLimit),
          limit: parsedLimit,
          offset: parsedOffset,
          hasNextPage: Math.floor(parsedOffset / parsedLimit) + 1 < Math.ceil(total / parsedLimit),
          hasPrevPage: Math.floor(parsedOffset / parsedLimit) + 1 > 1,
        },
      };

      // Store in cache for 1 hour
      await CacheService.set(cacheKey, JSON.stringify(response), 3600); // Cache for 1 hour

      res.status(200).json(response);
    } catch (error) {
      console.error("Error in listGeneralApplications:", error);
      next(error);
    }
  }

  static async changeStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status_id } = req.body;

      // Validate input
      if (!status_id) {
        return res.status(400).json({ success: false, message: "status_id is required" });
      }

      // Find the job application
      const application = await models.JobApplications.findByPk(id);
      if (!application) {
        return res.status(404).json({ success: false, message: "Job application not found" });
      }

      // Check if the status exists
      const status = await models.ApplicationStatus.findByPk(status_id);
      if (!status) {
        return res.status(400).json({ success: false, message: "Invalid status_id" });
      }

      // Update the status
      await application.update({ status_id });

      // Invalidate cache if needed
      await CacheService.invalidate("job_applications");

      // Optionally, include updated application with status details
      const updatedApplication = await models.JobApplications.findByPk(id, {
        include: [
          {
            model: models.ApplicationStatus,
            as: "status",
            attributes: ["id", "status_name"],
          },
        ],
      });

      res.json({
        success: true,
        data: updatedApplication,
        message: "Job application status updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async changeStatusGeneral(req, res, next) {
    try {
      const { id } = req.params;
      const { status_id } = req.body;

      // Validate input
      if (!status_id) {
        return res.status(400).json({ success: false, message: "status_id is required" });
      }

      // Find the job application
      const application = await models.GeneralApplications.findByPk(id);
      if (!application) {
        return res.status(404).json({ success: false, message: "Job application not found" });
      }

      // Check if the status exists
      const status = await models.ApplicationStatus.findByPk(status_id);
      if (!status) {
        return res.status(400).json({ success: false, message: "Invalid status_id" });
      }

      // Update the status
      await application.update({ status_id });

      // Invalidate cache if needed
      await CacheService.invalidate("general_applications");

      // Optionally, include updated application with status details
      const updatedApplication = await models.GeneralApplications.findByPk(id, {
        include: [
          {
            model: models.ApplicationStatus,
            as: "status",
            attributes: ["id", "status_name"],
          },
        ],
      });

      res.json({
        success: true,
        data: updatedApplication,
        message: "General application status updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async exportApplicationsToExcel(req, res, next) {
    try {
      const { role_id, location_id, state_id, status_id, applicant_location_id, applicant_state_id, from_date, to_date } = req.query;

      // Build filter conditions (simplified for export)
      const whereConditions = {};
      const applicantWhere = {};

      if (status_id) {
        whereConditions.status_id = parseInt(status_id);
      }

      // Note: location_id filtering will be handled in the job include section

      // Note: state_id filtering will be handled in the job include section

      // Handle applicant filtering (locations and states)
      const applicantFilters = [];

      if (applicant_location_id) {
        // Filter by preferred locations only (many-to-many relationship)
        applicantFilters.push({
          [Op.in]: require("sequelize").literal(`(
            SELECT applicant_id 
            FROM "applicant_locations" 
            WHERE location_id = ${parseInt(applicant_location_id)}
          )`),
        });
      }

      if (applicant_state_id) {
        // Filter by preferred states only (many-to-many relationship)
        applicantFilters.push({
          [Op.in]: require("sequelize").literal(`(
            SELECT applicant_id 
            FROM "applicant_states" 
            WHERE state_id = ${parseInt(applicant_state_id)}
          )`),
        });
      }

      if (applicantFilters.length > 0) {
        applicantWhere.id =
          applicantFilters.length === 1
            ? applicantFilters[0]
            : {
                [Op.and]: applicantFilters,
              };
      }

      if (from_date && to_date) {
        whereConditions.application_date = {
          [Op.between]: [new Date(from_date), new Date(to_date)],
        };
      } else if (from_date) {
        whereConditions.application_date = {
          [Op.gte]: new Date(from_date),
        };
      } else if (to_date) {
        whereConditions.application_date = {
          [Op.lte]: new Date(to_date),
        };
      }

      // Build include array for export with preferred locations and states
      const includeArray = [
        {
          model: models.Applicants,
          as: "applicant",
          attributes: [
            "id",
            "name",
            "email",
            "phone",
            "file",
            "expected_salary",
            "notice_period",
            "current_salary",
            "age",
            "employee_referral_code",
            "referred_employee_name",
            "current_location",
          ],
          ...(Object.keys(applicantWhere).length > 0 && { where: applicantWhere }),
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
            {
              model: models.ApplicantDistricts,
              as: "preferredDistricts",
              include: [
                {
                  model: models.Districts,
                  as: "district",
                },
              ],
            },
          ],
        },
        {
          model: models.CareerJobs,
          as: "job",
          paranoid: false,
          attributes: ["id", "job_title"],
          include: [
            {
              model: models.CareerRoles,
              as: "role",
              attributes: ["id", "role_name"],
            },
          ],
        },
        {
          model: models.ApplicationStatus,
          as: "status",
          attributes: ["id", "status_name"],
        },
      ];

      // Use separate count and findAll to avoid memory issues
      const total = await models.JobApplications.count({
        where: whereConditions,
      });

      const applications = await models.JobApplications.findAll({
        where: whereConditions,
        include: includeArray,
        order: [["application_date", "DESC"]],
        raw: false, // Ensure we get full objects
      });

      // Create Excel workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Job Applications");

      // Define columns
      worksheet.columns = [
        { header: "Application ID", key: "applicationId", width: 15 },
        { header: "Application Type", key: "applicationType", width: 25 },
        { header: "Applicant Name", key: "applicantName", width: 20 },
        { header: "Email", key: "email", width: 25 },
        { header: "Phone", key: "phone", width: 15 },
        { header: "Job Title", key: "jobTitle", width: 25 },
        { header: "Department", key: "role", width: 20 },
        // { header: "Job Location", key: "jobLocation", width: 20 },
        // { header: "State", key: "state", width: 15 },
        { header: "Preferred Locations", key: "preferredLocations", width: 30 },
        { header: "Preferred States", key: "preferredStates", width: 30 },
        { header: "Preferred District", key: "preferredDistrict", width: 30 },
        { header: "Status", key: "status", width: 15 },
        { header: "Application Date", key: "applicationDate", width: 20 },
        { header: "Resume", key: "resume", width: 30 },
        { header: "Age", key: "age", width: 30 },
        { header: "Current Salary", key: "currentSalary", width: 30 },
        { header: "Expected Salary", key: "expectedSalary", width: 30 },
        { header: "Notice Period", key: "noticePeriod", width: 30 },
        { header: "Current Location", key: "currentLocation", width: 30 },
        { header: "Referred Employee Name", key: "referredEmployeeName", width: 30 },
        { header: "Referral Code", key: "referralCode", width: 30 },
      ];

      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };

      // Add data rows
      applications.forEach((app, index) => {
        const plain = app.toJSON();

        // Get preferred location (primary or first) - same logic as listing API
        const preferredLocations = plain?.applicant?.preferredLocations || [];
        const primaryLocation = preferredLocations.find((loc) => loc?.ApplicantLocations?.is_primary) || preferredLocations[0];
        const preferredLocationName = primaryLocation?.location_name || "N/A";

        // Get preferred state (primary or first) - same logic as listing API
        const preferredStates = plain?.applicant?.preferredStates || [];
        const primaryState = preferredStates.find((state) => state?.ApplicantStates?.is_primary) || preferredStates[0];
        const preferredStateName = primaryState?.state_name || "N/A";
        const preferredDistrictName = plain?.applicant?.preferredDistricts?.district?.district_name || "N/A";

        console.log("Preferred District Name:", preferredDistrictName);
        console.log("Preferred District Name:", plain?.applicant?.preferredDistrict?.district?.district_name);
        console.log("Preferred District Name:", plain?.applicant?.preferredDistrict?.district);
        console.log("Preferred District Name:", plain?.applicant?.preferredDistrict);
        console.log("Preferred District Name:", plain?.applicant);

        const age = plain?.applicant.age ?? "N/A";
        const currentSalary = plain?.applicant.current_salary ?? "N/A";
        const expectedSalary = plain?.applicant.expected_salary ?? "N/A";
        const noticePeriod = plain?.applicant.notice_period ?? "N/A";
        const currentLocation = plain?.applicant.current_location ?? "N/A";
        const referredEmployeeName = plain?.applicant?.referred_employee_name?.trim() ? plain.applicant.referred_employee_name : "N/A";

        const referralCode = plain?.applicant?.employee_referral_code?.trim() ? plain.applicant.employee_referral_code : "N/A";

        const row = worksheet.addRow({
          applicationId: plain.id,
          applicationType: "Job Application",
          applicantName: plain.applicant?.name || "N/A",
          email: plain.applicant?.email || "N/A",
          phone: plain.applicant?.phone || "N/A",
          jobTitle: plain.job?.job_title || "N/A",
          role: plain.job?.role?.role_name || "N/A",
          preferredLocations: preferredLocationName,
          preferredStates: preferredStateName,
          preferredDistrict: preferredDistrictName,
          status: plain.status?.status_name || "N/A",
          applicationDate: plain.application_date ? new Date(plain.application_date).toLocaleDateString("en-GB") : "N/A",
          resume: plain.applicant?.file ? `Resume_${plain.applicant.name}_${plain.id}` : "No Resume",
          age,
          currentSalary,
          expectedSalary,
          noticePeriod,
          currentLocation,
          referredEmployeeName,
          referralCode,
        });

        // Add hyperlink for resume if file exists
        if (plain.applicant?.file) {
          const resumeCell = row.getCell("resume");

          // Construct the full URL for the resume
          const baseUrl = process.env.BASE_URL;
          const resumeUrl = `${baseUrl}/${plain.applicant.file}`;

          // Add hyperlink
          resumeCell.value = {
            text: `Resume_${plain.applicant.name}_${plain.id}`,
            hyperlink: resumeUrl,
          };

          // Style the hyperlink
          resumeCell.font = {
            color: { argb: "FF0000FF" },
            underline: true,
          };
        }
      });

      // Set response headers for Excel download
      const filename = `job_applications_${new Date().toISOString().split("T")[0]}.xlsx`;

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

      // Write to response
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      next(error);
    }
  }

  static async exportGeneralApplicationsToExcel(req, res, next) {
    try {
      const { role_id, location_id, state_id, status_id, applicant_state_id, from_date, to_date } = req.query;

      // Build filter conditions (same as listGeneralApplications)
      const whereConditions = {};
      const applicantWhere = {};

      if (status_id) {
        whereConditions.status_id = parseInt(status_id);
      }

      if (role_id) {
        whereConditions.role_id = parseInt(role_id);
      }

      // Handle applicant filtering (locations and states)
      const applicantFilters = [];

      if (location_id) {
        // Filter by preferred locations only (many-to-many relationship)
        applicantFilters.push({
          [Op.in]: require("sequelize").literal(`(
            SELECT applicant_id 
            FROM "applicant_locations" 
            WHERE location_id = ${parseInt(location_id)}
          )`),
        });
      }

      if (applicant_state_id) {
        // Filter by preferred states only (many-to-many relationship)
        applicantFilters.push({
          [Op.in]: require("sequelize").literal(`(
            SELECT applicant_id 
            FROM "applicant_states" 
            WHERE state_id = ${parseInt(applicant_state_id)}
          )`),
        });
      }

      if (applicantFilters.length > 0) {
        applicantWhere.id =
          applicantFilters.length === 1
            ? applicantFilters[0]
            : {
                [Op.and]: applicantFilters,
              };
      }

      if (from_date && to_date) {
        whereConditions.application_date = {
          [Op.between]: [new Date(from_date), new Date(to_date)],
        };
      } else if (from_date) {
        whereConditions.application_date = {
          [Op.gte]: new Date(from_date),
        };
      } else if (to_date) {
        whereConditions.application_date = {
          [Op.lte]: new Date(to_date),
        };
      }

      // Build include array for export with preferred locations and states
      const includeArray = [
        {
          model: models.Applicants,
          as: "applicant",
          attributes: [
            "id",
            "name",
            "email",
            "phone",
            "file",
            "expected_salary",
            "notice_period",
            "current_salary",
            "age",
            "employee_referral_code",
            "referred_employee_name",
            "current_location",
          ],
          ...(Object.keys(applicantWhere).length > 0 && { where: applicantWhere }),
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
            {
              model: models.ApplicantDistricts,
              as: "preferredDistricts",
              include: [
                {
                  model: models.Districts,
                  as: "district",
                },
              ],
            },
          ],
        },
        {
          model: models.CareerRoles,
          as: "role",
          attributes: ["id", "role_name"],
        },
        {
          model: models.ApplicationStatus,
          as: "status",
          attributes: ["id", "status_name"],
        },
      ];

      // Use separate count and findAll to avoid memory issues
      const total = await models.GeneralApplications.count({
        where: whereConditions,
      });

      const applications = await models.GeneralApplications.findAll({
        where: whereConditions,
        include: includeArray,
        order: [["application_date", "DESC"]],
        raw: false, // Ensure we get full objects
      });

      // Create Excel workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("General Applications");

      // Define columns
      worksheet.columns = [
        { header: "Application ID", key: "applicationId", width: 15 },
        { header: "Application Type", key: "applicationType", width: 25 },
        { header: "Applicant Name", key: "applicantName", width: 20 },
        { header: "Email", key: "email", width: 25 },
        { header: "Phone", key: "phone", width: 15 },
        { header: "Job Title", key: "role", width: 20 },
        { header: "Preferred Locations", key: "preferredLocations", width: 30 },
        { header: "Preferred States", key: "preferredStates", width: 30 },
        { header: "Preferred District", key: "preferredDistrict", width: 30 },
        { header: "Status", key: "status", width: 15 },
        { header: "Application Date", key: "applicationDate", width: 20 },
        { header: "Resume", key: "resume", width: 30 },
        { header: "Age", key: "age", width: 30 },
        { header: "Current Salary", key: "currentSalary", width: 30 },
        { header: "Expected Salary", key: "expectedSalary", width: 30 },
        { header: "Notice Period", key: "noticePeriod", width: 30 },
        { header: "Current Location", key: "currentLocation", width: 30 },
        { header: "Referred Employee Name", key: "referredEmployeeName", width: 30 },
        { header: "Referral Code", key: "referralCode", width: 30 },
      ];

      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };

      // Add data rows
      applications.forEach((app) => {
        const plain = app.toJSON();

        // Get preferred location (primary or first) - same logic as listing API
        const preferredLocations = plain?.applicant?.preferredLocations || [];
        const primaryLocation = preferredLocations.find((loc) => loc?.ApplicantLocations?.is_primary) || preferredLocations[0];
        const preferredLocationName = primaryLocation?.location_name || "N/A";

        // Get preferred state (primary or first) - same logic as listing API
        const preferredStates = plain?.applicant?.preferredStates || [];
        const primaryState = preferredStates.find((state) => state?.ApplicantStates?.is_primary) || preferredStates[0];
        const preferredStateName = primaryState?.state_name || "N/A";
        const preferredDistrictName = plain?.applicant?.preferredDistricts?.district?.district_name || "N/A";

        console.log("Preferred District Name:", preferredDistrictName);
        console.log("Preferred District Name:", plain?.applicant?.preferredDistrict?.district?.district_name);
        console.log("Preferred District Name:", plain?.applicant?.preferredDistrict?.district);
        console.log("Preferred District Name:", plain?.applicant?.preferredDistrict);
        console.log("Preferred District Name:", plain?.applicant);

        const age = plain?.applicant.age ?? "N/A";
        const currentSalary = plain?.applicant.current_salary ?? "N/A";
        const expectedSalary = plain?.applicant.expected_salary ?? "N/A";
        const noticePeriod = plain?.applicant.notice_period ?? "N/A";
        const currentLocation = plain?.applicant.current_location ?? "N/A";
        const referredEmployeeName = plain?.applicant?.referred_employee_name?.trim() ? plain.applicant.referred_employee_name : "N/A";

        const referralCode = plain?.applicant?.employee_referral_code?.trim() ? plain.applicant.employee_referral_code : "N/A";

        const row = worksheet.addRow({
          applicationId: plain.id,
          applicationType: "General Application",
          applicantName: plain.applicant?.name || "N/A",
          email: plain.applicant?.email || "N/A",
          phone: plain.applicant?.phone || "N/A",
          role: plain.role?.role_name || "N/A",
          preferredLocations: preferredLocationName,
          preferredStates: preferredStateName,
          preferredDistrict: preferredDistrictName,
          status: plain.status?.status_name || "N/A",
          applicationDate: plain.application_date ? new Date(plain.application_date).toLocaleDateString("en-GB") : "N/A",
          resume: plain.applicant?.file ? `Resume_${plain.applicant.name}_${plain.id}` : "No Resume",
          age,
          currentSalary,
          expectedSalary,
          noticePeriod,
          currentLocation,
          referredEmployeeName,
          referralCode,
        });

        // Add hyperlink for resume if file exists
        if (plain.applicant?.file) {
          const resumeCell = row.getCell("resume");

          // Construct the full URL for the resume
          const baseUrl = process.env.BASE_URL || req.protocol + "://" + req.get("host");
          const resumeUrl = `${baseUrl}/${plain.applicant.file}`;

          // Add hyperlink
          resumeCell.value = {
            text: `Resume_${plain.applicant.name}_${plain.id}`,
            hyperlink: resumeUrl,
          };

          // Style the hyperlink
          resumeCell.font = {
            color: { argb: "FF0000FF" },
            underline: true,
          };
        }
      });

      // Set response headers for Excel download
      const filename = `general_applications_${new Date().toISOString().split("T")[0]}.xlsx`;

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

      // Write to response
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = JobApplicationSubmissionController;
