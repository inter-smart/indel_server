const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middlewares/authMiddleware");
const celebrationUpload = require("../../middlewares/celebrationUpload");
const celebrationUploadCleanup = require("../../middlewares/celebrationUploadCleanup");
const Controller = require("../../controllers/celebrations/celebrationMediaController");
const { validateCelebrationMedia, validateCelebrationMediaUpdate } = require("../../utils/celebrationValidator");

const upload = celebrationUpload("celebrations/media");
const uploadFields = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "video", maxCount: 1 },
  { name: "video_thumbnail", maxCount: 1 },
]);

router.use(authMiddleware(["admin", "hr", "hr-executive", "manager"]));
router.get("/", Controller.getAll);
router.get("/:id", Controller.getById);
router.post("/", uploadFields, validateCelebrationMedia, celebrationUploadCleanup, Controller.create);
router.put("/:id", uploadFields, validateCelebrationMediaUpdate, celebrationUploadCleanup, Controller.update);
router.delete("/:id", Controller.delete);

module.exports = router;
