const { models, sequelize } = require("../../models/index");
const CustomError = require("../../utils/customError");
const { buildPagination } = require("../../utils/celebrationHelpers");

const { CelebrationCategories, CelebrationSubcategories, CelebrationPageContent } = models;

const CATEGORY_PAGE_SIZE = 9;
const SUBCATEGORY_PAGE_SIZE = 12;
const MEDIA_PAGE_SIZE = 12;
const MAX_LIMIT = 50;

// A media row that can actually be shown: an image item with an image, or a video item with a video.
const PLAYABLE = `m.is_active = true AND (
  (COALESCE(m.is_video, false) = false AND COALESCE(m.image, '') <> '') OR
  (m.is_video = true AND COALESCE(m.video, '') <> '')
)`;
const THUMB = `CASE WHEN m.is_video THEN m.video_thumbnail ELSE m.image END`;

// A subcategory that is shown: active and with at least one playable media item.
const VISIBLE_SUB = `s.is_active = true AND EXISTS (
  SELECT 1 FROM celebration_media m WHERE m.subcategory_id = s.id AND ${PLAYABLE}
)`;

const firstMediaThumb = (subAlias) => `(
  SELECT ${THUMB} FROM celebration_media m
   WHERE m.subcategory_id = ${subAlias}.id AND ${PLAYABLE} AND COALESCE(${THUMB}, '') <> ''
   ORDER BY m."order" ASC, m.id ASC LIMIT 1
)`;

const run = async (sql, replacements) => {
  const [rows] = await sequelize.query(sql, { replacements });
  return rows;
};

const paging = (query, defaultLimit) => {
  const requested = parseInt(query.limit, 10);
  const limit = Math.min(MAX_LIMIT, requested >= 1 ? requested : defaultLimit);
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  return { page, limit };
};

// Clamp the requested page to the last page and return the final offset.
const clampPage = (total, page, limit) => {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const current = Math.min(page, totalPages);
  return { current, offset: (current - 1) * limit };
};

const toPagination = (total, current, limit) => {
  const base = buildPagination(total, current, limit);
  return { totalCount: total, totalPages: base.totalPages, currentPage: current, limit };
};

const findCategory = async (slug) => {
  const category = await CelebrationCategories.findOne({ where: { slug, is_active: true } });
  if (!category) throw new CustomError("Category not found", 404);
  return category;
};

const findSubcategory = async (category, subSlug) => {
  const subcategory = await CelebrationSubcategories.findOne({
    where: { category_id: category.id, slug: subSlug, is_active: true },
  });
  if (!subcategory) throw new CustomError("Subcategory not found", 404);
  return subcategory;
};

const CATEGORY_VISIBLE = `c.is_active = true AND EXISTS (
  SELECT 1 FROM celebration_subcategories s WHERE s.category_id = c.id AND ${VISIBLE_SUB}
)`;

class CelebrationsWebController {
  // GET /categories?page&limit  -> slider items + paginated category cards
  static async categories(req, res, next) {
    try {
      const { page, limit } = paging(req.query, CATEGORY_PAGE_SIZE);

      const [{ total }] = await run(
        `SELECT COUNT(*)::int AS total FROM celebration_categories c WHERE ${CATEGORY_VISIBLE}`
      );
      const { current, offset } = clampPage(total, page, limit);

      const select = `
        SELECT c.id, c.title, c.slug, c.description, c.image_alt AS alt,
               COALESCE(
                 NULLIF(c.cover_image, ''),
                 (SELECT NULLIF(s.cover_image, '') FROM celebration_subcategories s
                   WHERE s.category_id = c.id AND ${VISIBLE_SUB} AND COALESCE(s.cover_image, '') <> ''
                   ORDER BY s."order" ASC, s.id DESC LIMIT 1),
                 (SELECT ${firstMediaThumb("s")} FROM celebration_subcategories s
                   WHERE s.category_id = c.id AND ${VISIBLE_SUB}
                   ORDER BY s."order" ASC, s.id DESC LIMIT 1)
               ) AS cover,
               (SELECT COUNT(*)::int FROM celebration_subcategories s
                 WHERE s.category_id = c.id AND ${VISIBLE_SUB}) AS "subcategoryCount"
          FROM celebration_categories c
         WHERE ${CATEGORY_VISIBLE}`;

      const [categories, sliderItems, pageContent] = await Promise.all([
        run(`${select} ORDER BY c."order" ASC, c.id ASC LIMIT :limit OFFSET :offset`, { limit, offset }),
        run(`${select} AND c.is_slider = true ORDER BY c."order" ASC, c.id ASC`),
        CelebrationPageContent.findOne({
          attributes: ["title", "description", "meta_title", "meta_description", "meta_keywords"],
        }),
      ]);

      res.json({
        status: "success",
        data: {
          sliderItems: sliderItems.map(({ id, subcategoryCount, ...item }) => item),
          categories: categories.map(({ id, ...item }) => item),
          pageContent: pageContent || null,
          pagination: toPagination(total, current, limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /categories/:slug?page&limit  -> paginated subcategory cards
  static async subcategories(req, res, next) {
    try {
      const category = await findCategory(req.params.slug);
      const { page, limit } = paging(req.query, SUBCATEGORY_PAGE_SIZE);

      const [{ total }] = await run(
        `SELECT COUNT(*)::int AS total FROM celebration_subcategories s
          WHERE s.category_id = :categoryId AND ${VISIBLE_SUB}`,
        { categoryId: category.id }
      );
      if (total === 0) throw new CustomError("Category not found", 404);
      const { current, offset } = clampPage(total, page, limit);

      const rows = await run(
        `SELECT s.title, s.slug, s.description, s.image_alt AS alt,
                COALESCE(NULLIF(s.cover_image, ''), ${firstMediaThumb("s")}, NULLIF(:categoryCover, '')) AS cover,
                (SELECT COUNT(*)::int FROM celebration_media m
                  WHERE m.subcategory_id = s.id AND ${PLAYABLE} AND COALESCE(m.is_video, false) = false) AS "photoCount",
                (SELECT COUNT(*)::int FROM celebration_media m
                  WHERE m.subcategory_id = s.id AND ${PLAYABLE} AND m.is_video = true) AS "videoCount"
           FROM celebration_subcategories s
          WHERE s.category_id = :categoryId AND ${VISIBLE_SUB}
          ORDER BY s."order" ASC, s.id DESC
          LIMIT :limit OFFSET :offset`,
        { categoryId: category.id, categoryCover: category.cover_image || "", limit, offset }
      );

      res.json({
        status: "success",
        data: {
          category: { title: category.title, slug: category.slug, description: category.description },
          subcategories: rows,
          pagination: toPagination(total, current, limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /categories/:slug/:subSlug?type&page&limit  -> mixed media, 12 per page
  static async media(req, res, next) {
    try {
      const category = await findCategory(req.params.slug);
      const subcategory = await findSubcategory(category, req.params.subSlug);
      const type = ["image", "video"].includes(req.query.type) ? req.query.type : "all";
      const { page, limit } = paging(req.query, MEDIA_PAGE_SIZE);

      // counts ignore the type filter so the tabs can always show their totals
      const [counts] = await run(
        `SELECT COUNT(*) FILTER (WHERE COALESCE(m.is_video, false) = false)::int AS image,
                COUNT(*) FILTER (WHERE m.is_video = true)::int AS video
           FROM celebration_media m
          WHERE m.subcategory_id = :subId AND ${PLAYABLE}`,
        { subId: subcategory.id }
      );
      if (counts.image + counts.video === 0) throw new CustomError("Subcategory not found", 404);
      const total = type === "image" ? counts.image : type === "video" ? counts.video : counts.image + counts.video;
      const { current, offset } = clampPage(total, page, limit);

      const typeFilter =
        type === "image" ? "AND COALESCE(m.is_video, false) = false" : type === "video" ? "AND m.is_video = true" : "";
      const rows = await run(
        `SELECT m.id, m.is_video, m.image, m.image_alt, m.video, m.video_thumbnail, m.thumbnail_alt
           FROM celebration_media m
          WHERE m.subcategory_id = :subId AND ${PLAYABLE} ${typeFilter}
          ORDER BY m."order" ASC, m.id ASC
          LIMIT :limit OFFSET :offset`,
        { subId: subcategory.id, limit, offset }
      );

      const items = rows.map((row) =>
        row.is_video
          ? {
              id: row.id,
              type: "video",
              video: row.video,
              thumbnail: row.video_thumbnail,
              alt: row.thumbnail_alt || row.image_alt || subcategory.title,
            }
          : { id: row.id, type: "image", image: row.image, alt: row.image_alt || subcategory.title }
      );

      res.json({
        status: "success",
        data: {
          category: { title: category.title, slug: category.slug },
          subcategory: {
            title: subcategory.title,
            slug: subcategory.slug,
            description: subcategory.description,
          },
          counts: { all: counts.image + counts.video, image: counts.image, video: counts.video },
          items,
          pagination: toPagination(total, current, limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CelebrationsWebController;
