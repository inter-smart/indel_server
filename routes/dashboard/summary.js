const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middlewares/authMiddleware");
const DashboardController = require("../../controllers/dashboard/dashboardController");

router.get("/", authMiddleware(["admin", "manager", "hr"]), DashboardController.getSummary);

module.exports = router;
