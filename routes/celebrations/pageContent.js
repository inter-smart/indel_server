const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middlewares/authMiddleware");
const validateMiddleware = require("../../middlewares/validateMiddleware");
const Controller = require("../../controllers/celebrations/celebrationPageContentController");
const { validateCelebrationPageContentUpdate } = require("../../utils/celebrationValidator");

router.use(authMiddleware(["admin", "hr", "hr-executive", "manager"]));
router.get("/", Controller.get);
router.put("/", validateCelebrationPageContentUpdate, validateMiddleware, Controller.update);

module.exports = router;
