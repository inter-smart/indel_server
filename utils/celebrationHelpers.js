const fs = require("fs/promises");
const path = require("path");
const { Op, fn, col } = require("sequelize");
const slugify = require("./slugify");
const Logger = require("../services/logger");

const UPLOADS_ROOT = path.join(__dirname, "..", "uploads");
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HTTP_URL_REGEX = /^https?:\/\/\S+$/i;

const toStoredPath = (subfolder, file) => `/uploads/${subfolder}/${file.filename}`;

const toBool = (value, fallback = undefined) => {
  if (value === undefined || value === null || value === "") return fallback;
  return value === true || value === "true" || value === "1" || value === 1;
};

// Deletes a file recorded in the DB ("/uploads/..."). External URLs and paths outside uploads/ are ignored.
const deleteStoredFile = async (storedPath) => {
  if (!storedPath || HTTP_URL_REGEX.test(storedPath)) return;
  const relative = String(storedPath).replace(/^\/?uploads\//, "");
  const absolute = path.resolve(UPLOADS_ROOT, relative);
  if (!absolute.startsWith(UPLOADS_ROOT + path.sep)) return;
  try {
    await fs.unlink(absolute);
    Logger.info(`Deleted file: ${storedPath}`);
  } catch (error) {
    if (error.code !== "ENOENT") {
      Logger.error(`Failed to delete file ${storedPath}: ${error.message}`);
    }
  }
};

const uploadedFiles = (req) => {
  if (req.file) return [req.file];
  if (!req.files) return [];
  return Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
};

// Removes whatever multer wrote for this request (used when the request is rejected). Besides
// req.file(s) it covers req.celebrationUploads, the paths recorded by middlewares/celebrationUpload.js,
// which also include files of a request multer aborted halfway.
const deleteRequestFiles = async (req) => {
  const paths = new Set([...uploadedFiles(req).map((file) => file.path), ...(req.celebrationUploads || [])]);
  await Promise.all(
    [...paths].map(async (filePath) => {
      try {
        await fs.unlink(path.resolve(filePath));
      } catch (error) {
        if (error.code !== "ENOENT") {
          Logger.error(`Failed to remove upload ${filePath}: ${error.message}`);
        }
      }
    })
  );
};

// ?page / ?limit. Admin lists stay un-paginated (full list) when neither is sent.
const parsePaging = (query, { defaultLimit = 10, maxLimit = 100 } = {}) => {
  const hasPaging = query.page !== undefined || query.limit !== undefined;
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { hasPaging, page, limit, offset: (page - 1) * limit };
};

const buildPagination = (total, page, limit) => {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    totalPages,
    limit,
    offset: (page - 1) * limit,
    total,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

// Unique slug among rows matching `scope` (e.g. the same category). Appends -1, -2, ... when taken.
const generateUniqueSlug = async (Model, text, { scope = {}, excludeId = null, fallback = "item" } = {}) => {
  const base = slugify(text) || fallback;
  let candidate = base;
  let count = 0;
  for (;;) {
    // eslint-disable-next-line no-await-in-loop
    if (!(await isSlugTaken(Model, candidate, { scope, excludeId }))) return candidate;
    count += 1;
    candidate = `${base}-${count}`;
  }
};

const isSlugTaken = async (Model, slug, { scope = {}, excludeId = null } = {}) => {
  const where = { ...scope, slug };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  return (await Model.count({ where })) > 0;
};

// { [parentId]: count } for the given parent ids, e.g. media per subcategory.
const countBy = async (Model, field, ids, extraWhere = {}) => {
  if (!ids.length) return {};
  const rows = await Model.findAll({
    attributes: [field, [fn("COUNT", col("id")), "count"]],
    where: { [field]: { [Op.in]: ids }, ...extraWhere },
    group: [field],
    raw: true,
  });
  return rows.reduce((acc, row) => {
    acc[row[field]] = parseInt(row.count, 10);
    return acc;
  }, {});
};

module.exports = {
  SLUG_REGEX,
  HTTP_URL_REGEX,
  toStoredPath,
  toBool,
  deleteStoredFile,
  deleteRequestFiles,
  parsePaging,
  buildPagination,
  generateUniqueSlug,
  isSlugTaken,
  countBy,
};
