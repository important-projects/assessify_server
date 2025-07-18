const express = require("express");
const router = express.Router();
const User = require("../../../models/User");
const Test = require("../../../models/Test");
const { protect } = require("../authentication/Authentication");

/*
router.get("/:id", protect, async (req, res) => {
  console.log("Fetched user id:", req.params.id);

  try {
    const { userId } = req.params;

    const tests = await Test.find({ userId })

    const totalTests = tests.length;
    const completedTests = tests.filter(test => test.status === "completed").length;
    const averageScore = totalTests > 0 ? (tests.reduce((acc, test) => acc + test.totalScore, 0) / totalTests).toFixed(2) : 0;

    const activeTests = tests.filter(test => test.status === "active")
    const completedTestsData = tests.filter(test => test.status === "completed")

    res.json({
      totalTests,
      completedTests,
      averageScore,
      activeTests,
      completedTests: completedTestsData,
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/active/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const activeTests = await Test.find({ userId, status: "active" });

    res.json(activeTests);
  } catch (error) {
    console.error("Error fetching active tests:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
*/

router.get("/user", protect, async (req, res) => {
  const userId = req.user.id;
  console.log("Decoded user id:", userId);

  try {
    const user = await User.findById(userId).select('username email age userNumber registeredCourses avatarUrl');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user: ", error);
    res.status(500).json({
      message: "Error fetching user",
      error,
    });
  }
});

module.exports = router;