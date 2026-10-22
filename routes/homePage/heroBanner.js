const express = require("express");
const router = express.Router();
const HeroBannerController = require("../../controllers/homePage/heroBannerController");
const authMiddleware = require("../../middlewares/authMiddleware");
const { validateHeroBanner, validateHeroBannerUpdate } = require("../../utils/validator");
const validateMiddleware = require("../../middlewares/validateMiddleware");
const createUploadMiddleware = require("../../middlewares/multerMiddleware");

const upload = createUploadMiddleware("banner");
const uploadField = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "image_mobile", maxCount: 1 },
  { name: "video", maxCount: 1 },
  { name: "video_mobile", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
]);

router.get("/", HeroBannerController.getAll);
router.get("/:id", HeroBannerController.getById);

router.use(authMiddleware(["admin", "hr", "hr-executive", "manager"]));
router.post("/", uploadField, validateHeroBanner, validateMiddleware, HeroBannerController.create);
router.put("/:id", uploadField, validateHeroBannerUpdate, validateMiddleware, HeroBannerController.update);
router.delete("/:id", HeroBannerController.delete);

module.exports = router;
