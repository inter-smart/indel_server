const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middlewares/authMiddleware");
const celebrationUpload = require("../../middlewares/celebrationUpload");
const celebrationUploadCleanup = require("../../middlewares/celebrationUploadCleanup");
const Controller = require("../../controllers/celebrations/celebrationCategoriesController");
const {
  validateCelebrationCategory,
  validateCelebrationCategoryUpdate,
} = require("../../utils/celebrationValidator");

const upload = celebrationUpload("celebrations/categories");
const uploadCover = upload.single("cover_image");

router.use(authMiddleware(["admin", "hr", "hr-executive", "manager"]));
router.get("/", Controller.getAll);
router.get("/:id", Controller.getById);
router.post("/", uploadCover, validateCelebrationCategory, celebrationUploadCleanup, Controller.create);
router.put("/:id", uploadCover, validateCelebrationCategoryUpdate, celebrationUploadCleanup, Controller.update);
router.delete("/:id", Controller.delete);

module.exports = router;
