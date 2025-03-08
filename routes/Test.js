const express = require("express");
const Question = require("../models/Question");
const User = require("../models/User");
const Test = require("../models/Test");
const { protect, isAdmin } = require("./Authentication");
const router = express.Router();

// Get categories
router.get("/categories", protect, (req, res) => {
  const categories = [
    "React.js",
    "PHP",
    "Python",
    "C++",
    "Java",
    "HTML",
    "AWS",
    "Google Cloud",
  ];
  res.json(categories);
});

// Get questions for a specific category
router.get("/questions/:category", protect, async (req, res) => {
  const category = req.params.category;
  console.log("Category received: ", category);
  try {
    const questions = await Question.aggregate([
      { $match: { category } },
      { $sample: { size: 40 } },
    ]);
    console.log("Questions found:", questions);
    res.json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ message: "Error fetching questions", error });
  }
});

// Test submission
router.post("/submit", protect, async (req, res) => {
  const { category, answers } = req.body;
  const userId = req.user.id;

  try {
    const gradedAnswers = await Promise.all(
      answers.map(async (answer) => {
        const question = await Question.findById(answer.questionId);
        if (!question) {
          return res.status(400).json({ message: `Question with ID ${answer.questionId} not found.` });
        }
        const isCorrect = String(answer.answer).trim() === String(question.correctAnswer).trim();
        return {
          questionId: answer.questionId,
          answer: answer.answer,
          correctAnswer: question.correctAnswer,
          category: question.category,
          isCorrect,
          score: isCorrect ? 1 : 0,
        };
      })
    );

    // Calculate total score
    const totalScore = gradedAnswers.reduce((acc, answer) => acc + answer.score, 0);

    // Save test result
    const test = new Test({ userId, category, answers: gradedAnswers, totalScore });
    await test.save();

    // Update user points
    const user = await User.findById(userId);
    if (user) {
      user.points += totalScore * 10; // Example: 10 points per correct answer
      await user.save();

      // Update badges and streaks
      await assignBadges(user);
      await trackUserStreak(user);
    }

    res.status(201).json({
      message: "Test submitted and graded successfully",
      totalScore,
      answers: gradedAnswers,
      newPoints: user?.points || 0,
    });
  } catch (error) {
    console.error("Error submitting test:", error);
    res.status(500).json({ message: "Error submitting test", error });
  }
});

// Get all tests submitted by all users (Admin Access Only)
router.get("/submitted-tests", protect, isAdmin, async (req, res) => {
  try {
    const tests = await Test.find().populate("userId", "username email");
    console.log("Retrieved tests:", tests);
    res.json(tests);
  } catch (error) {
    console.error("Error retrieving tests:", error);
    res.status(500).json({ message: "Error retrieving tests", error });
  }
});

// Get a specific test by ID (Admin Access Only)
router.get("/submitted-tests/:id", protect, isAdmin, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
      .populate("userId", "username email")
      .populate({
        path: "answers.questionId",
        select: "questionText category options correctAnswer", // Include fields relevant to display
      });

    if (!test) return res.status(404).json({ message: "Test not found" });
    res.status(200).json(test);
  } catch (error) {
    console.error("Error retrieving test:", error);
    res.status(500).json({ message: "Error retrieving test", error });
  }
});

router.get("/test-query", protect, async (req, res) => {
  try {
    const tests = await Test.find();
    res.status(200).json(tests);
  } catch (error) {
    res.status(500).json({ message: "Error executing test query", error });
  }
});

// Get all tests submitted by a user (Admin Access Only)
router.get("/submitted", protect, isAdmin, async (req, res) => {
  try {
    const tests = await Test.find().populate("userId", "username email");
    console.log("Retrieved tests:", tests);

    res.json(tests);
  } catch (error) {
    console.error("Error retrieving tests:", error);
    res.status(500).json({ message: "Error retrieving tests", error });
  }
});

// Get all test scores (Admin Access Only)
router.get("/results", protect, isAdmin, async (req, res) => {
  try {
    // const tests = await Test.find({ userId: { $ne: null } }).populate(
    const tests = await Test.find().populate("userId", "username email");

    res.json(tests);
  } catch (error) {
    console.error("Error retrieving scores:", error);
    res.status(500).json({ message: "Error retrieving scores", error });
  }
});

module.exports = router;
