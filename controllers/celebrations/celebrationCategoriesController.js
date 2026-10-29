const { Op, literal } = require("sequelize");
const { models } = require("../../models/index");
const CustomError = require("../../utils/customError");
const Logger = require("../../services/logger");
const {
  SLUG_REGEX,
  toStoredPath,
  toBool,
  deleteStoredFile,
  deleteRequestFiles,
  parsePaging,
  buildPagination,
  parseSort,
  generateUniqueSlug,
  isSlugTaken,
  countBy,
} = require("../../utils/celebrationHelpers");

const { CelebrationCategories, CelebrationSubcategories } = models;

const UPLOAD_FOLDER = "celebrations/categories";

const DEFAULT_ORDER = [
  ["order", "ASC"],
  ["id", "ASC"],
];

// ?sort_by values. subcategory_count is a correlated count, so sorting stays in SQL and paging stays correct.
const SORTABLE = {
  order: ["order"],
  title: ["title"],
  slug: ["slug"],
  subcategory_count: [
    literal('(SELECT COUNT(*) FROM celebration_subcategories AS s WHERE s.category_id = "CelebrationCategories"."id")'),
  ],
};

const withCounts = async (rows) => {
  const counts = await countBy(
    CelebrationSubcategories,
    "category_id",
    rows.map((row) => row.id)
  );
  return rows.map((row) => ({ ...row.toJSON(), subcategory_count: counts[row.id] || 0 }));
};

class CelebrationCategoriesController {
  static async getAll(req, res, next) {
    try {
      const { search } = req.query;
      const { hasPaging, page, limit, offset } = parsePaging(req.query);
      const order = parseSort(req.query, SORTABLE, DEFAULT_ORDER);
      const where = {};
      if (search && search.trim()) {
        const term = `%${search.trim()}%`;
        where[Op.or] = [{ title: { [Op.iLike]: term } }, { slug: { [Op.iLike]: term } }];
      }

      if (!hasPaging) {
        const rows = await CelebrationCategories.findAll({ where, order });
        return res.json({ success: true, data: await withCounts(rows) });
      }

      const { count, rows } = await CelebrationCategories.findAndCountAll({ where, order, limit, offset });
      res.json({
        success: true,
        data: await withCounts(rows),
        total: count,
        pagination: buildPagination(count, page, limit),
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const category = await CelebrationCategories.findByPk(req.params.id);
      if (!category) throw new CustomError("Category not found", 404);
      res.json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    let saved = false;
    try {
      const { title, description, image_alt, order, is_slider, is_active } = req.body;

      const requestedSlug = (req.body.slug || "").trim();
      let slug;
      if (requestedSlug) {
        if (await isSlugTaken(CelebrationCategories, requestedSlug)) {
          throw new CustomError("Slug is already used by another category", 409);
        }
        slug = requestedSlug;
      } else {
        slug = await generateUniqueSlug(CelebrationCategories, title, { fallback: "category" });
      }

      const category = await CelebrationCategories.create({
        title: title.trim(),
        slug,
        description: description || null,
        image_alt: image_alt || null,
        order: order ? parseInt(order, 10) : 0,
        is_slider: toBool(is_slider, false),
        is_active: toBool(is_active, true),
        cover_image: req.file ? toStoredPath(UPLOAD_FOLDER, req.file) : null,
      });
      saved = true;

      res.status(201).json({ success: true, data: category, message: "Category created" });
    } catch (error) {
      if (!saved) await deleteRequestFiles(req);
      next(error);
    }
  }

  static async update(req, res, next) {
    let saved = false;
    try {
      const category = await CelebrationCategories.findByPk(req.params.id);
      if (!category) throw new CustomError("Category not found", 404);

      const body = req.body;
      const changes = {};
      if (body.title !== undefined) changes.title = body.title.trim();
      if (body.description !== undefined) changes.description = body.description || null;
      if (body.image_alt !== undefined) changes.image_alt = body.image_alt || null;
      if (body.order !== undefined && body.order !== "") changes.order = parseInt(body.order, 10);
      if (body.is_slider !== undefined) changes.is_slider = toBool(body.is_slider, false);
      if (body.is_active !== undefined) changes.is_active = toBool(body.is_active, true);

      // The slug (public URL) only changes when it is sent explicitly.
      const requestedSlug = (body.slug || "").trim();
      if (requestedSlug && requestedSlug !== category.slug) {
        if (!SLUG_REGEX.test(requestedSlug)) throw new CustomError("Slug format is invalid", 400);
        if (await isSlugTaken(CelebrationCategories, requestedSlug, { excludeId: category.id })) {
          throw new CustomError("Slug is already used by another category", 409);
        }
        changes.slug = requestedSlug;
      }

      const oldCover = category.cover_image;
      if (req.file) changes.cover_image = toStoredPath(UPLOAD_FOLDER, req.file);

      await category.update(changes);
      saved = true;

      if (req.file && oldCover) await deleteStoredFile(oldCover);
      res.json({ success: true, data: category, message: "Category updated" });
    } catch (error) {
      if (!saved) await deleteRequestFiles(req);
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const category = await CelebrationCategories.findByPk(req.params.id);
      if (!category) throw new CustomError("Category not found", 404);

      const subcategories = await CelebrationSubcategories.count({ where: { category_id: category.id } });
      if (subcategories > 0) {
        throw new CustomError(
          `Cannot delete: this category has ${subcategories} subcategor${subcategories === 1 ? "y" : "ies"}. Delete or move them first.`,
          409
        );
      }

      const cover = category.cover_image;
      await category.destroy();
      await deleteStoredFile(cover);
      Logger.info(`Celebration category ${req.params.id} deleted`);
      res.json({ success: true, message: "Category deleted", data: req.params.id });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CelebrationCategoriesController;
