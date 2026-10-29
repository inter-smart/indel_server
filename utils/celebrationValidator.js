const { check } = require("express-validator");
const { SLUG_REGEX, HTTP_URL_REGEX } = require("./celebrationHelpers");

// Shape checks only. Rules that need the DB (parent exists, slug unique, delete blocked) live in the controllers.

const slugCheck = check("slug")
  .optional({ checkFalsy: true })
  .custom((value) => SLUG_REGEX.test(String(value).trim()))
  .withMessage("Slug may only contain lowercase letters, numbers and single hyphens");

const orderCheck = check("order")
  .optional({ checkFalsy: true })
  .isInt({ min: 0 })
  .withMessage("Order must be a non-negative integer");

const activeCheck = check("is_active").optional().isBoolean().withMessage("is_active must be a boolean");

const validateCelebrationCategory = [
  check("title").trim().notEmpty().withMessage("Title is required"),
  slugCheck,
  orderCheck,
  check("is_slider").optional().isBoolean().withMessage("is_slider must be a boolean"),
  activeCheck,
];

const validateCelebrationCategoryUpdate = [
  check("title").optional().trim().notEmpty().withMessage("Title cannot be empty"),
  slugCheck,
  orderCheck,
  check("is_slider").optional().isBoolean().withMessage("is_slider must be a boolean"),
  activeCheck,
];

const validateCelebrationSubcategory = [
  check("category_id").isInt({ gt: 0 }).withMessage("Category is required"),
  check("title").trim().notEmpty().withMessage("Title is required"),
  slugCheck,
  orderCheck,
  activeCheck,
];

const validateCelebrationSubcategoryUpdate = [
  check("category_id").optional().isInt({ gt: 0 }).withMessage("Category must be a positive integer"),
  check("title").optional().trim().notEmpty().withMessage("Title cannot be empty"),
  slugCheck,
  orderCheck,
  activeCheck,
];

const videoCheck = check("video")
  .optional({ checkFalsy: true })
  .custom((value) => HTTP_URL_REGEX.test(String(value).trim()))
  .withMessage("Video must be an uploaded file or a valid http(s) URL");

const validateCelebrationMedia = [
  check("subcategory_id").isInt({ gt: 0 }).withMessage("Subcategory is required"),
  check("is_video").optional().isBoolean().withMessage("is_video must be a boolean"),
  videoCheck,
  orderCheck,
  activeCheck,
];

const validateCelebrationMediaUpdate = [
  check("subcategory_id").optional().isInt({ gt: 0 }).withMessage("Subcategory must be a positive integer"),
  check("is_video").optional().isBoolean().withMessage("is_video must be a boolean"),
  videoCheck,
  orderCheck,
  activeCheck,
];

const validateCelebrationPageContentUpdate = [
  check("title").optional().trim().notEmpty().withMessage("Title cannot be empty"),
  check("description").optional().trim().notEmpty().withMessage("Description cannot be empty"),
  check("meta_title").optional().trim().notEmpty().withMessage("Meta title cannot be empty"),
  check("meta_description").optional().trim().notEmpty().withMessage("Meta description cannot be empty"),
  check("meta_keywords").optional().trim().notEmpty().withMessage("Meta keywords cannot be empty"),
];

module.exports = {
  validateCelebrationPageContentUpdate,
  validateCelebrationCategory,
  validateCelebrationCategoryUpdate,
  validateCelebrationSubcategory,
  validateCelebrationSubcategoryUpdate,
  validateCelebrationMedia,
  validateCelebrationMediaUpdate,
};
