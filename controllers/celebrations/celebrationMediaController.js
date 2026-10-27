const { Op } = require("sequelize");
const { models } = require("../../models/index");
const CustomError = require("../../utils/customError");
const {
  HTTP_URL_REGEX,
  toStoredPath,
  toBool,
  deleteStoredFile,
  deleteRequestFiles,
  parsePaging,
  buildPagination,
} = require("../../utils/celebrationHelpers");

const { CelebrationCategories, CelebrationSubcategories, CelebrationMedia } = models;

const UPLOAD_FOLDER = "celebrations/media";

const subcategoryInclude = {
  model: CelebrationSubcategories,
  as: "subcategory",
  attributes: ["id", "title", "slug", "category_id"],
  include: [{ model: CelebrationCategories, as: "category", attributes: ["id", "title", "slug"] }],
};

const requireSubcategory = async (subcategoryId) => {
  const subcategory = await CelebrationSubcategories.findByPk(subcategoryId);
  if (!subcategory) throw new CustomError("Subcategory does not exist", 400);
  return subcategory;
};

const pickUpload = (req, field) => {
  const file = req.files?.[field]?.[0];
  return file ? toStoredPath(UPLOAD_FOLDER, file) : null;
};

/**
 * Decides what the row will contain and which files become unused.
 *  - image item: needs an image; video fields are cleared
 *  - video item: needs a video (file or http(s) URL) AND a thumbnail; image fields are cleared
 * `existing` is the current row on update, null on create.
 */
const resolveMedia = (req, existing) => {
  const body = req.body;
  const isVideo = toBool(body.is_video, existing ? existing.is_video : false);

  const upload = {
    image: pickUpload(req, "image"),
    video: pickUpload(req, "video"),
    video_thumbnail: pickUpload(req, "video_thumbnail"),
  };
  const videoUrl = !upload.video && body.video && HTTP_URL_REGEX.test(body.video.trim()) ? body.video.trim() : null;

  const next = { is_video: isVideo };
  const oldFiles = []; // stored files that stop being referenced once the row is saved
  const usedUploads = new Set();

  const take = (field, uploaded, current) => {
    if (uploaded) {
      usedUploads.add(uploaded);
      if (current && current !== uploaded) oldFiles.push(current);
      return uploaded;
    }
    return current || null;
  };

  if (isVideo) {
    next.video = upload.video ? take("video", upload.video, existing?.video) : videoUrl || existing?.video || null;
    if (videoUrl && existing?.video && existing.video !== videoUrl) oldFiles.push(existing.video);
    next.video_thumbnail = take("video_thumbnail", upload.video_thumbnail, existing?.video_thumbnail);
    if (!next.video) throw new CustomError("A video file or video URL is required for a video item", 400);
    if (!next.video_thumbnail) throw new CustomError("A thumbnail image is required for a video item", 400);

    next.image = null;
    next.image_alt = null;
    if (existing?.image) oldFiles.push(existing.image);
    if (body.thumbnail_alt !== undefined) next.thumbnail_alt = body.thumbnail_alt || null;
  } else {
    next.image = take("image", upload.image, existing?.image);
    if (!next.image) throw new CustomError("An image is required for an image item", 400);

    next.video = null;
    next.video_thumbnail = null;
    next.thumbnail_alt = null;
    if (existing?.video) oldFiles.push(existing.video);
    if (existing?.video_thumbnail) oldFiles.push(existing.video_thumbnail);
    if (body.image_alt !== undefined) next.image_alt = body.image_alt || null;
  }

  // Uploaded files that did not make it into the row (e.g. a video upload on an image item).
  const unusedUploads = Object.values(upload).filter((stored) => stored && !usedUploads.has(stored));
  return { next, oldFiles, unusedUploads };
};

class CelebrationMediaController {
  static async getAll(req, res, next) {
    try {
      const { search, subcategory_id, category_id, type } = req.query;
      const { hasPaging, page, limit, offset } = parsePaging(req.query);
      const order = [
        ["order", "ASC"],
        ["id", "ASC"],
      ];

      const where = {};
      if (subcategory_id) where.subcategory_id = parseInt(subcategory_id, 10) || 0;
      if (category_id) where["$subcategory.category_id$"] = parseInt(category_id, 10) || 0;
      if (type === "image") where.is_video = false;
      if (type === "video") where.is_video = true;
      if (search && search.trim()) {
        const term = `%${search.trim()}%`;
        where[Op.or] = [
          { image_alt: { [Op.iLike]: term } },
          { thumbnail_alt: { [Op.iLike]: term } },
          { "$subcategory.title$": { [Op.iLike]: term } },
        ];
      }

      const options = { where, include: [subcategoryInclude], order, distinct: true };

      if (!hasPaging) {
        const rows = await CelebrationMedia.findAll(options);
        return res.json({ success: true, data: rows });
      }

      const { count, rows } = await CelebrationMedia.findAndCountAll({ ...options, limit, offset });
      res.json({
        success: true,
        data: rows,
        total: count,
        pagination: buildPagination(count, page, limit),
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const item = await CelebrationMedia.findByPk(req.params.id, { include: [subcategoryInclude] });
      if (!item) throw new CustomError("Media item not found", 404);
      res.json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    let saved = false;
    try {
      const subcategoryId = parseInt(req.body.subcategory_id, 10);
      await requireSubcategory(subcategoryId);

      const { next: values, unusedUploads } = resolveMedia(req, null);
      const item = await CelebrationMedia.create({
        ...values,
        subcategory_id: subcategoryId,
        order: req.body.order ? parseInt(req.body.order, 10) : 0,
        is_active: toBool(req.body.is_active, true),
      });
      saved = true;

      await Promise.all(unusedUploads.map(deleteStoredFile));
      res.status(201).json({ success: true, data: item, message: "Media item created" });
    } catch (error) {
      if (!saved) await deleteRequestFiles(req);
      next(error);
    }
  }

  static async update(req, res, next) {
    let saved = false;
    try {
      const item = await CelebrationMedia.findByPk(req.params.id);
      if (!item) throw new CustomError("Media item not found", 404);

      const changes = {};
      if (req.body.subcategory_id) {
        const subcategoryId = parseInt(req.body.subcategory_id, 10);
        if (subcategoryId !== item.subcategory_id) {
          await requireSubcategory(subcategoryId);
          changes.subcategory_id = subcategoryId;
        }
      }
      if (req.body.order !== undefined && req.body.order !== "") changes.order = parseInt(req.body.order, 10);
      if (req.body.is_active !== undefined) changes.is_active = toBool(req.body.is_active, true);

      const { next: values, oldFiles, unusedUploads } = resolveMedia(req, item);
      await item.update({ ...changes, ...values });
      saved = true;

      await Promise.all([...oldFiles, ...unusedUploads].map(deleteStoredFile));
      res.json({ success: true, data: item, message: "Media item updated" });
    } catch (error) {
      if (!saved) await deleteRequestFiles(req);
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const item = await CelebrationMedia.findByPk(req.params.id);
      if (!item) throw new CustomError("Media item not found", 404);

      const files = [item.image, item.video, item.video_thumbnail];
      await item.destroy();
      await Promise.all(files.map(deleteStoredFile));
      res.json({ success: true, message: "Media item deleted", data: req.params.id });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CelebrationMediaController;
