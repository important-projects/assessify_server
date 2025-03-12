const express = require('express')
const router = express.Router()
const { protect } = require('./Authentication')
const User = require('../models/User')
const Question = require('../models/Question')
const Test = require('../models/Test')
const mongoose = require('mongoose')
const axios = require('axios')
require('dotenv').config()

// AI Grading Function
const gradeSubjectiveAnswers = async (testId, subjectiveAnswers) => {
  try {
    console.log(`Grading subjective answers for test ${testId}...`)

    for (let ans of subjectiveAnswers) {
      const { data } = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content:
                'You are an AI grading assistant. Grade the answer based on correctness and relevance.'
            },
            {
              role: 'user',
              content: `Question: ${ans.questionText}\nUser Answer: ${ans.answer}\nCorrect Answer: ${ans.correctAnswer}\n\nGrade the answer from 0 to 5, where 5 is completely correct and 0 is wrong. Explain why.`
            }
          ],
          max_tokens: 100
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.GPT_API_KEY}`
          }
        }
      )

      const aiResponse = data.choices[0].message.content
      const scoreMatch = aiResponse.match(/Score:\s*(\d+)/)
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 0

      ans.isCorrect = score >= 3
      ans.score = score

      console.log(`Graded: ${ans.answer} => Score: ${score}`)
    }

    // Update only the subjective answers in the database
    await Test.updateOne(
      { _id: testId },
      { $set: { answers: subjectiveAnswers } }
    )

    console.log(`✅ AI grading completed for test ${testId}`)
  } catch (error) {
    console.error('❌ Error grading subjective answers:', error)
  }
}

// Get all tests and number of tests for a user
router.get('/tests/total/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params
    console.log(
      'Fetching total tests and total number of tests for user:',
      userId
    )

    const totalTests = await Test.find({ userId })
    console.log('Total tests response:', totalTests)

    const totalTestsCount = await Test.countDocuments({ userId })
    console.log('Total number of tests:', totalTestsCount)
    res.json({ totalTests, totalTestsCount })
  } catch (error) {
    console.log('Error fetching all tests and total number of tests:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Get all active tests for a user
router.get('/tests/active/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params
    console.log('Fetching active tests for user:', userId)

    const activeTests = await Test.find({ userId, status: 'active' })
    console.log('Active tests response:', activeTests)
    res.json(activeTests)
  } catch (error) {
    console.error('Error fetching active tests:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Get all completed tests for a user
router.get('/completed-test/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params

    const completedTests = await Test.find({ userId, status: 'completed' })
    console.log('Completed tests response:', completedTests)

    const completedTestsCount = await Test.countDocuments({
      userId,
      status: 'completed'
    })
    console.log('Total number of completed tests:', completedTestsCount)
    res.json({ completedTests, completedTestsCount })
  } catch (error) {
    console.error('Error fetching completed tests:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Get total number of active tests for a user
router.get('/tests/active/count/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params
    console.log('Fetching active test count for user:', userId)

    const activeTestCount = await Test.countDocuments({
      userId,
      status: 'active'
    })
    console.log('Total active tests:', activeTestCount)

    res.json({ activeTestCount })
  } catch (error) {
    console.error('Error fetching active test count:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Get detailed info about a specific completed test
router.get('/completed-test/:testId', protect, async (req, res) => {
  try {
    const { testId } = req.params

    if (!mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(400).json({ message: 'Invalid test ID format' })
    }

    const test = await Test.findOne({
      _id: testId,
      status: 'completed'
    }).populate('answers.questionId')

    if (!test) {
      return res.status(404).json({ message: 'Completed test not found' })
    }

    console.log('Test details response:', test)
    res.status(200).json(test)
  } catch (error) {
    console.error('Error fetching test details:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Get user's test info
router.get('/test/info/:testId', protect, async (req, res) => {
  try {
    const { testId } = req.params
    const userId = req.user.id

    if (!mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(400).json({ message: 'Invalid test ID format' })
    }

    const test = await Test.findById(testId)

    if (!test) {
      return res
        .status(404)
        .json({ message: 'Test not found or unauthorized access.' })
    }

    if (test.status === 'completed') {
      return res.status(400).json({ message: 'Test already completed.' })
    }

    res.status(200).json({ success: true, test })
  } catch (error) {
    console.error('Error fetching test info:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

router.post('/test/start/:testId', protect, async (req, res) => {
  try {
    const { testId } = req.params
    const userId = req.user.id

    let test = await Test.findById(testId)
    if (!test) {
      return res.status(404).json({ message: 'Test not found.' })
    }

    if (test.status === 'completed') {
      return res.status(400).json({ message: 'Test already completed' })
    }

    let userTestRecord = await Test.findOne({ userId, testId })

    if (!userTestRecord) {
      const startTime = new Date()
      const endTime = new Date(startTime.getTime() + test.duration * 60000)

      userTestRecord = new Test({
        userId,
        testId,
        testName: test.testName,
        category: test.category,
        duration: test.duration,
        dueDate: test.dueDate || new Date(endTime),
        startedAt: startTime,
        endTime: endTime,
        status: 'ongoing'
      })

      await userTestRecord.save()
    }

    res.status(200).json({
      message: 'Test started successfully',
      testId: test._id,
      testName: test.testName,
      category: test.category,
      duration: test.duration,
      startedAt: userTestRecord.startedAt,
      endTime: userTestRecord.endTime
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/test/submit/:testId', protect, async (req, res) => {
  try {
    const { testId } = req.params
    const { answers } = req.body

    let test = await Test.findById(testId)
    if (!test) {
      return res.status(404).json({ message: 'Test not found' })
    }
    if (test.status === 'completed') {
      return res.status(400).json({ message: 'Test already submitted' })
    }

    let totalScore = 0
    let processedAnswers = []

    for (let ans of answers) {
      const question = await Question.findById(ans.questionId)
      if (!question) continue

      let isCorrect = false
      let score = 0

      if (question.questionType === 'objective') {
        isCorrect = ans.answer === question.correctAnswer
        score = isCorrect ? 1 : 0
      } else {
        isCorrect = null
        score = 0
      }

      processedAnswers.push({
        questionId: ans.questionId,
        questionText: question.text, // ✅ Store question text for AI grading
        answer: ans.answer,
        correctAnswer: question.correctAnswer || null,
        isCorrect,
        score
      })

      totalScore += score
    }

    test.answers = processedAnswers
    test.totalScore = totalScore
    test.status = 'completed'
    await test.save()

    const response = {
      message: 'Test submitted successfully',
      totalScore,
      testId: test._id,
      status: 'completed'
    }
    console.log('Test submission response:', response)
    res.status(200).json(response)

    // AI Grading (Run it asynchronously)
    const subjectiveAnswers = processedAnswers.filter(
      ans => ans.isCorrect === null
    )
    if (subjectiveAnswers.length > 0) {
      gradeSubjectiveAnswers(testId, subjectiveAnswers)
    }
  } catch (error) {
    console.error(error)
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error' })
    }
  }
})

router.post('/submit/:testId', protect, async (req, res) => {
  try {
    const { testId } = req.params
    const { answers } = req.body

    const test = await Test.findById(testId)

    if (!test) {
      return res.status(404).json({ message: 'Test not found' })
    }

    // Calculate total score
    let totalScore = 0

    answers.forEach(ans => {
      const question = test.answers.find(
        q => q.questionId.toString() === ans.questionId
      )
      if (question) {
        question.answer = ans.answer
        question.isCorrect = question.correctAnswer === ans.answer
        question.score = question.isCorrect ? 1 : 0
        totalScore += question.score
      }
    })

    test.totalScore = totalScore
    test.status = 'completed'
    await test.save()

    const response = { message: 'Test submitted successfully', totalScore }
    console.log('Test submission response:', response) // Log response
    res.json(response)
  } catch (error) {
    console.error('Error submitting test:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

router.get('/test/questions/:testId', protect, async (req, res) => {
  try {
    const { testId } = req.params

    const test = await Test.findById(testId).populate('questions') // Populate questions

    const questions = await Question.find({ testId: test._id })

    if (!test) {
      return res.status(404).json({ message: 'Test not found' })
    }

    console.log('Fetched Questions:', test.questions)
    res.status(200).json({ questions: test.questions })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/performance/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params

    const completedTests = await Test.find({ userId, status: 'completed' })

    if (!completedTests.length) {
      const response = { message: 'No completed tests found' }
      console.log('Performance response:', response) // Log response
      return res.json(response)
    }

    const scores = completedTests.map(test => ({
      testName: test.testName,
      totalScore: test.totalScore,
      createdAt: test.createdAt
    }))

    console.log('Performance response:', scores) // Log response
    res.json(scores)
  } catch (error) {
    console.error('Error fetching performance data:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

router.get('/tests/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params
    const tests = await Test.find({ userId, status: 'completed' }).sort({
      createdAt: -1
    })

    const response = { tests }
    console.log('Tests response:', response) // Log response
    res.status(200).json(response)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/performance/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params

    const tests = await Test.find({ userId, status: 'completed' })

    if (tests.length === 0) {
      const response = { averageScore: 0, performanceTrend: [] }
      console.log('Performance response:', response) // Log response
      return res.status(200).json(response)
    }

    const totalScore = tests.reduce((sum, test) => sum + test.totalScore, 0)
    const averageScore = totalScore / tests.length

    // Performance trend: Last 5 tests
    const performanceTrend = tests
      .slice(-5)
      .map(test => ({ date: test.createdAt, score: test.totalScore }))

    const response = { averageScore, performanceTrend }
    console.log('Performance response:', response) // Log response
    res.status(200).json(response)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/leaderboard', protect, async (req, res) => {
  try {
    const users = await User.aggregate([
      {
        $lookup: {
          from: 'tests',
          localField: '_id',
          foreignField: 'userId',
          as: 'tests'
        }
      },
      {
        $addFields: {
          averageScore: {
            $cond: {
              if: { $gt: [{ $size: '$tests' }, 0] },
              then: { $avg: '$tests.totalScore' },
              else: 0
            }
          }
        }
      },
      { $sort: { averageScore: -1 } },
      { $limit: 10 }, // Top 10 users
      {
        $project: {
          username: 1,
          email: 1,
          averageScore: 1
        }
      }
    ])

    const response = { leaderboard: users }
    console.log('Leaderboard response:', response) // Log response
    res.status(200).json(response)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
/*router.get("/test/chart-data", protect, async (req, res) => {
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

router.get("/leaderboard", protect, async (req, res) => {
  try {
    const users = await User.find().sort({ points: -1 }).limit(10);

    // Reward function
    const rewardUser = async (user) => {
      if (user.streak === 7) {
        console.log(`${user.username} has a 7-day streak! Rewarding 100 bonus points.`);
        user.points += 100;
      }
      if (user.points >= 1000 && !user.badges.includes("Elite Scholar")) {
        console.log(`${user.username} reached 1000 points! Special badge awarded.`);
        user.badges.push("Elite Scholar");
      }
      await user.save();
    };

    // Process rewards for users
    await Promise.all(users.map(rewardUser));

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching leaderboard", error });
  }
});



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

*/

// module.exports = router
