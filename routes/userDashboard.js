const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/middleware");
const userDashboardController = require("../controllers/userDashboard");
const { upload } = require("../utils/mediaUpload");

router.put("/profile", protect, userDashboardController.userProfile);
router.get("/courses/list", userDashboardController.courseList);
router.get("/courses", protect, userDashboardController.userCourses);
router.get(
  "/courses/:courseId",
  protect,
  userDashboardController.userCourseById
);
router.get(
  "/courses/test/:courseId",
  protect,
  userDashboardController.userTest
);
router.get(
  "/courses/view-test/:testId",
  protect,
  userDashboardController.viewUserTest
);
router.get(
  "/test/questions/:testId",
  protect,
  userDashboardController.getUserQuestions
);

router.post(
  "/test/start/:testId",
  protect,
  userDashboardController.startUserTest
);
router.post(
  "/submit-test/:testId",
  protect,
  userDashboardController.userSubmitTest
);
router.post(
  "/test/create",
  protect,
  upload.single("file"),
  userDashboardController.userCreateTest
);

module.exports = router;
