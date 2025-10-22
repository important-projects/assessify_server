const express = require("express");
const adminDashboardController = require("../controllers/adminDashboard");
const { protect, isAdmin } = require("../middleware/middleware");
const router = express.Router();

router.get(
  "/leaderboard",
  protect,
  isAdmin,
  adminDashboardController.getLeaderboardData
);

router.get(
  "/courses/list",
  protect,
  isAdmin,
  adminDashboardController.listAvailableCourses
);

router.post(
  "/tests/create",
  protect,
  isAdmin,
  adminDashboardController.createTest
);

router.post(
  "/courses/create",
  protect,
  isAdmin,
  adminDashboardController.createCourse
);

module.exports = router;
