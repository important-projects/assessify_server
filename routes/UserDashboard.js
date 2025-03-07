const express = require("express");
const router = express.Router();
const { protect } = require("./Authentication");
const Test = require("../models/Test");

// Get all test results for the user
router.get("/test/results", protect, async (req, res) => {
  try {
    // Fetch all test results
    const tests = await Test.find({ userId: req.user.id }).populate(
      "userId",
      "username email"
    );
    res.json(tests);
  } catch (error) {
    console.error("Error retrieving user test results", error);
    res.status(500).json({ message: "Error retrieving test results", error });
  }
});

// Get detailed result of a specific test
router.get("/test/result/:id", protect, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
      .populate("userId", "username email")
      .populate({
        path: "answers.questionId",
        select: "questionText category options correctAnswer",
      });

    if (!test) {
      return res.status(404).json({ message: "Test not found." });
    }
    res.json(test);
  } catch (error) {
    console.error("Error retrieving test details:", error);
    res.status(500).json({ message: "Error retrieving test details", error });
  }
});

// Get top 10 scores for user
router.get("/test/top-ten", protect, async (req, res) => {
  try {
    const topScores = await Test.find({ userId: req.user.id })
      .sort({ totalScore: -1 })
      .limit(10)
      .populate("userId", "username email");
    res.json(topScores);
  } catch (error) {
    console.error("Error retrieving top scores", error);
    res.status(500).json({ message: "Error retrieving top scores", error });
  }
});

router.get("/test/statistics", protect, async (req, res) => {
  try {
    const resultCounts = await Test.aggregate([
      { $match: { userId: req.user.id } },
      { $unwind: "$answers" },
      { $group: { _id: "$answers.category", count: { $sum: 1 } } },
    ]);
    const labels = resultCounts.map((item) => item._id);
    const values = resultCounts.map((item) => item.count);
    res.json({ labels, values });
  } catch (error) {
    console.error("Error retrieving pie chart data:", error);
    res.status(500).json({
      message: "Error retrieving pie chart data",
      error: error.message,
    });
  }
});

module.exports = router;
