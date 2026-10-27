const { Op, literal } = require("sequelize");
const { models } = require("../../models/index");
const CustomError = require("../../utils/customError");
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

const { CelebrationCategories, CelebrationSubcategories, CelebrationMedia } = models;

const UPLOAD_FOLDER = "celebrations/subcategories";

const categoryInclude = {
  model: CelebrationCategories,
  as: "category",
  attributes: ["id", "title", "slug"],
};

const DEFAULT_ORDER = [
  ["category_id", "ASC"],
  ["order", "ASC"],
  ["id", "DESC"],
];

// ?sort_by values. media_count is a correlated count, so sorting stays in SQL and paging stays correct.
const SORTABLE = {
  order: ["order"],
  title: ["title"],
  slug: ["slug"],
  category: [{ model: CelebrationCategories, as: "category" }, "title"],
  media_count: [
    literal('(SELECT COUNT(*) FROM celebration_media AS m WHERE m.subcategory_id = "CelebrationSubcategories"."id")'),
  ],
};

const withCounts = async (rows) => {
  const counts = await countBy(
    CelebrationMedia,
    "subcategory_id",
    rows.map((row) => row.id)
  );
  return rows.map((row) => ({ ...row.toJSON(), media_count: counts[row.id] || 0 }));
};

const requireCategory = async (categoryId) => {
  const category = await CelebrationCategories.findByPk(categoryId);
  if (!category) throw new CustomError("Category does not exist", 400);
  return category;
};

class CelebrationSubcategoriesController {
  static async getAll(req, res, next) {
    try {
      const { search, category_id } = req.query;
      const { hasPaging, page, limit, offset } = parsePaging(req.query);
      const order = parseSort(req.query, SORTABLE, DEFAULT_ORDER);

      const where = {};
      if (category_id) where.category_id = parseInt(category_id, 10) || 0;
      if (search && search.trim()) {
        const term = `%${search.trim()}%`;
        where[Op.or] = [
          { title: { [Op.iLike]: term } },
          { slug: { [Op.iLike]: term } },
          { "$category.title$": { [Op.iLike]: term } },
        ];
      }

      if (!hasPaging) {
        const rows = await CelebrationSubcategories.findAll({ where, include: [categoryInclude], order });
        return res.json({ success: true, data: await withCounts(rows) });
      }

      const { count, rows } = await CelebrationSubcategories.findAndCountAll({
        where,
        include: [categoryInclude],
        order,
        limit,
        offset,
        distinct: true,
      });
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
      const subcategory = await CelebrationSubcategories.findByPk(req.params.id, { include: [categoryInclude] });
      if (!subcategory) throw new CustomError("Subcategory not found", 404);
      res.json({ success: true, data: subcategory });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    let saved = false;
    try {
      const { title, description, image_alt, order, is_active } = req.body;
      const categoryId = parseInt(req.body.category_id, 10);
      await requireCategory(categoryId);

      const scope = { category_id: categoryId };
      const requestedSlug = (req.body.slug || "").trim();
      let slug;
      if (requestedSlug) {
        if (await isSlugTaken(CelebrationSubcategories, requestedSlug, { scope })) {
          throw new CustomError("Slug is already used by another subcategory in this category", 409);
        }
        slug = requestedSlug;
      } else {
        slug = await generateUniqueSlug(CelebrationSubcategories, title, { scope, fallback: "album" });
      }

      const subcategory = await CelebrationSubcategories.create({
        category_id: categoryId,
        title: title.trim(),
        slug,
        description: description || null,
        image_alt: image_alt || null,
        order: order ? parseInt(order, 10) : 0,
        is_active: toBool(is_active, true),
        cover_image: req.file ? toStoredPath(UPLOAD_FOLDER, req.file) : null,
      });
      saved = true;

      res.status(201).json({ success: true, data: subcategory, message: "Subcategory created" });
    } catch (error) {
      if (!saved) await deleteRequestFiles(req);
      next(error);
    }
  }

  static async update(req, res, next) {
    let saved = false;
    try {
      const subcategory = await CelebrationSubcategories.findByPk(req.params.id);
      if (!subcategory) throw new CustomError("Subcategory not found", 404);

      const body = req.body;
      const changes = {};
      if (body.title !== undefined) changes.title = body.title.trim();
      if (body.description !== undefined) changes.description = body.description || null;
      if (body.image_alt !== undefined) changes.image_alt = body.image_alt || null;
      if (body.order !== undefined && body.order !== "") changes.order = parseInt(body.order, 10);
      if (body.is_active !== undefined) changes.is_active = toBool(body.is_active, true);

      const categoryId = body.category_id ? parseInt(body.category_id, 10) : subcategory.category_id;
      if (categoryId !== subcategory.category_id) {
        await requireCategory(categoryId);
        changes.category_id = categoryId;
      }

      // The slug (public URL) only changes when it is sent explicitly, but it must stay unique
      // inside the target category, which matters when the subcategory is moved.
      const requestedSlug = (body.slug || "").trim();
      const nextSlug = requestedSlug || subcategory.slug;
      if (nextSlug !== subcategory.slug || categoryId !== subcategory.category_id) {
        if (!SLUG_REGEX.test(nextSlug)) throw new CustomError("Slug format is invalid", 400);
        const taken = await isSlugTaken(CelebrationSubcategories, nextSlug, {
          scope: { category_id: categoryId },
          excludeId: subcategory.id,
        });
        if (taken) {
          throw new CustomError("Slug is already used by another subcategory in this category", 409);
        }
        changes.slug = nextSlug;
      }

      const oldCover = subcategory.cover_image;
      if (req.file) changes.cover_image = toStoredPath(UPLOAD_FOLDER, req.file);

      await subcategory.update(changes);
      saved = true;

      if (req.file && oldCover) await deleteStoredFile(oldCover);
      res.json({ success: true, data: subcategory, message: "Subcategory updated" });
    } catch (error) {
      if (!saved) await deleteRequestFiles(req);
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const subcategory = await CelebrationSubcategories.findByPk(req.params.id);
      if (!subcategory) throw new CustomError("Subcategory not found", 404);

      const mediaCount = await CelebrationMedia.count({ where: { subcategory_id: subcategory.id } });
      if (mediaCount > 0) {
        throw new CustomError(
          `Cannot delete: this subcategory has ${mediaCount} media item${mediaCount === 1 ? "" : "s"}. Delete or move them first.`,
          409
        );
      }

      const cover = subcategory.cover_image;
      await subcategory.destroy();
      await deleteStoredFile(cover);
      res.json({ success: true, message: "Subcategory deleted", data: req.params.id });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CelebrationSubcategoriesController;
