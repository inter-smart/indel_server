const { Op } = require("sequelize");
const { models, sequelize } = require("../../models/index");
const CacheService = require("../../services/cacheService");
const CustomError = require("../../utils/customError");
const fs = require("fs").promises;
const path = require("path");
const Logger = require("../../services/logger");

const HeroBanner = models.HeroBanner;
const States = models.CareerStates;

class HeroBannerController {
  static async deleteFile(filePath) {
    if (!filePath) return;
    try {
      const absolutePath = path.join(__dirname, "..", "..", "uploads", filePath.replace("/uploads/", ""));
      await fs.unlink(absolutePath);
      Logger.info(`Deleted file: ${filePath}`);
    } catch (error) {
      if (error.code !== "ENOENT") {
        Logger.error(`Failed to delete file ${filePath}: ${error.message}`);
      }
    }
  }

  static async create(req, res, next) {
    try {
      const { title, button_text, button_link, image_alt_text, is_active, order, state_id, banner_type, media_type, video_link } = req.body;
      const image = req.files?.image ? `/uploads/banner/${req.files.image[0].filename}` : null;
      const mobileImage = req.files?.image_mobile ? `/uploads/banner/${req.files.image_mobile[0].filename}` : null;
      const video = req.files?.video ? `/uploads/banner/${req.files.video[0].filename}` : null;
      const video_mobile = req.files?.video_mobile ? `/uploads/banner/${req.files.video_mobile[0].filename}` : null;
      const thumbnail = media_type === "video" && req.files?.thumbnail ? `/uploads/banner/${req.files.thumbnail[0].filename}` : null;

      if (state_id) {
        const state = await States.findByPk(state_id);
        if (!state || !state.is_active) {
          throw new CustomError("Invalid or inactive state", 400);
        }
      }

      const heroBanner = await HeroBanner.create({
        title,
        button_text,
        button_link,
        state_id: state_id || null,
        image,
        image_mobile: mobileImage,
        video,
        video_mobile,
        thumbnail,
        media_type,
        image_alt_text,
        is_active,
        banner_type,
        video_link,
        order,
      });

      await CacheService.invalidate("heroBanners");
      await CacheService.invalidate(`banners_${state_id || "null"}`);
      await CacheService.invalidate("webHomeData");

      res.status(201).json({ success: true, data: heroBanner, message: "Hero Banner created successfully" });
    } catch (error) {
      next(error);
    }
  }

  // static async getAll(req, res, next) {
  //   try {
  //     const cacheKey = "heroBanners";
  //     const cachedData = await CacheService.get(cacheKey);

  //     // if (cachedData) {
  //     //   return res.json({ success: true, data: JSON.parse(cachedData) });
  //     // }

  //     const heroBanners = await HeroBanner.findAll({
  //       order: [["order", "ASC"]],
  //     });
  //     await CacheService.set(cacheKey, JSON.stringify(heroBanners), 3600);
  //     res.json({ success: true, data: heroBanners });
  //   } catch (error) {
  //     next(error);
  //   }
  // }

  static async getAll(req, res, next) {
    try {
      const { stateId } = req.query;
      const cacheKey = `banners_${stateId || "null"}`;
      const cachedData = await CacheService.get(cacheKey);

      // if (cachedData) {
      //   return res.json({ success: true, data: JSON.parse(cachedData) });
      // }

      const banners = await HeroBanner.findAll({
        // where: whereClause,
        // include: [{ model: States, attributes: ["state_name"], as: "state" }],
        // order: [
        //   [sequelize.literal(`state_id ${stateId ? "= " + Number(stateId) : "IS NULL"}`), "DESC"],
        //   ["order", "ASC"],
        //   ["createdAt", "DESC"],
        // ],
        // limit: Number(limit),
      });

      await CacheService.set(cacheKey, JSON.stringify(banners), 3600);
      res.json({ success: true, data: banners });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const heroBanner = await HeroBanner.findByPk(req.params.id);
      if (!heroBanner) {
        throw new CustomError("HeroBanner not found", 404);
      }
      res.json({ success: true, data: heroBanner });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const heroBanner = await HeroBanner.findByPk(req.params.id);
      if (!heroBanner) {
        throw new CustomError("HeroBanner not found", 404);
      }

      const { title, button_text, button_link, location, image_alt_text, is_active, order, state_id, banner_type, media_type, video_link } = req.body;

      // Validate state if provided
      if (state_id) {
        const state = await States.findByPk(state_id);
        if (!state || !state.is_active) {
          throw new CustomError("Invalid or inactive state", 400);
        }
      }

      // Default values from existing banner
      let image = heroBanner.image;
      let image_mobile = heroBanner.image_mobile;
      let video = heroBanner.video;
      let video_mobile = heroBanner.video_mobile;
      let thumbnail = heroBanner.thumbnail;

      // MEDIA TYPE HANDLING
      if (media_type === "video") {
        // Set videos
        video = req.files?.video ? `/uploads/banner/${req.files.video[0].filename}` : heroBanner.video;

        video_mobile = req.files?.video_mobile ? `/uploads/banner/${req.files.video_mobile[0].filename}` : heroBanner.video_mobile;

        thumbnail = req.files?.thumbnail ? `/uploads/banner/${req.files.thumbnail[0].filename}` : heroBanner.thumbnail;

        // Force images to NULL
        image = null;
        image_mobile = null;
      }

      if (media_type === "image") {
        // Set images
        image = req.files?.image ? `/uploads/banner/${req.files.image[0].filename}` : heroBanner.image;

        image_mobile = req.files?.image_mobile ? `/uploads/banner/${req.files.image_mobile[0].filename}` : heroBanner.image_mobile;

        // Force videos to NULL
        video = null;
        video_mobile = null;
        thumbnail = null;
      }

      await heroBanner.update({
        title,
        button_text,
        button_link,
        location,
        image,
        image_mobile,
        video,
        video_mobile,
        thumbnail,
        media_type,
        state_id: state_id || null,
        image_alt_text,
        is_active,
        banner_type,
        video_link: media_type === "video" ? video_link : null,
        order,
      });

      await CacheService.invalidate("heroBanners");
      await CacheService.invalidate("webHomeData");

      res.json({
        success: true,
        data: heroBanner,
        message: "Hero Banner updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const heroBanner = await HeroBanner.findByPk(req.params.id);
      if (!heroBanner) {
        throw new CustomError("HeroBanner not found", 404);
      }
      await heroBanner.destroy();
      await CacheService.invalidate("heroBanners");
      await CacheService.invalidate("webHomeData");

      res.json({ success: true, message: "Hero banner deleted", data: req.params.id });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = HeroBannerController;
