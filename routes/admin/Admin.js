const express = require('express')
const Question = require("../../models/Question")
const { protect } = require('../user/authentication/Authentication')
const { isAdmin } = require('./authentication/Authentication')
const Test = require('../../models/Test')
const router = express.Router()
const multer = require('multer')
const fs = require("fs");
const pdfparse = require('pdf-parse')
// const path = require("path");

// Configure Multer to handle file uploads (for single file)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
})

const upload = multer({ storage })

// Get all test scores (Admin Access Only)
router.get('/results', protect, isAdmin, async (req, res) => {
  try {
    const tests = await Test.find({ userId: { $ne: null } }).populate(
      'userId',
      'username email'
    )
    res.json(tests)
  } catch (error) {
    console.error('Error retrieving scores:', error)
    res
      .status(500)
      .json({ message: 'Error retrieving scores', error: error.message })
  }
})

// Get top 10 scores
router.get('/top10', protect, isAdmin, async (req, res) => {
  try {
    const topScores = await Test.find()
      .sort({ totalScore: -1 }) // Sort by totalScore, not score
      .limit(10)
      .populate('userId', 'username email')
    res.json(topScores)
  } catch (error) {
    console.error('Error retrieving top scores:', error)
    res
      .status(500)
      .json({ message: 'Error retrieving top scores', error: error.message })
  }
})

// Get pie chart data
router.get('/pieData', protect, isAdmin, async (req, res) => {
  try {
    const resultCounts = await Test.aggregate([
      { $unwind: '$answers' },
      { $group: { _id: '$answers.category', count: { $sum: 1 } } }
    ])

    const labels = resultCounts.map(item => item._id)
    const values = resultCounts.map(item => item.count)

    res.json({ labels, values })
  } catch (error) {
    console.error('Error retrieving pie chart data:', error)
    res.status(500).json({
      message: 'Error retrieving pie chart data',
      error: error.message
    })
  }
})

// Get leaderboard data (Top 10 users by total score)
router.get('/leaderboard', protect, isAdmin, async (req, res) => {
  try {
    const leaderboard = await Test.aggregate([
      {
        $group: {
          _id: '$userId',
          totalScore: { $sum: '$totalScore' },
          testCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      { $unwind: '$userDetails' },
      { $sort: { totalScore: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 1,
          totalScore: 1,
          testCount: 1,
          'userDetails.username': 1,
          'userDetails.email': 1
        }
      }
    ])

    res.json(leaderboard)
  } catch (error) {
    console.error('Error retrieving leaderboard:', error)
    res
      .status(500)
      .json({ message: 'Error retrieving leaderboard', error: error.message })
  }
})


// Create a new test (Admin Access Only)
router.post(
  '/tests/create',
  isAdmin,
  upload.single('file'),
  async (req, res) => {
    const { testName, category, course } = req.body
    const file = req.file
    const adminId = req.user.id

    if (!testName || !course || !category) {
      return res.status(400).json({ message: "Invalid request body" })
    }
    if (!mongoose.Types.ObjectId.isValid(course)) {
      return res.status(400).json({ message: 'Invalid course ID' });
    }


    // Validate uploaded file
    if (
      !file ||
      (file.mimetype !== 'application/pdf' &&
        file.mimetype !== 'application/msword' &&
        file.mimetype !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    ) {
      return res.status(400).json({ message: 'Invalid file type' })
    }

    if (file.size > 10 * 1024 * 1024) {
      return res.status(400).json({ message: 'File size exceeds limit' })
    }

    try {
      const buffer = fs.readFileSync(file.path)
      const pdfData = await pdfParse(buffer)

      const lines = pdfData.text
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)

      const parsedQuestions = []
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('Question:')) {
          const questionText = lines[i].replace('Question:', '').trim()
          const options = []

          if (lines[i + 1]?.startsWith('Options:')) {
            for (
              let j = i + 2;
              j < lines.length && /^[a-dA-D]\./.test(lines[j]);
              j++
            ) {
              options.push(lines[j].trim())
            }
          }

          const questionType = options.length > 0 ? 'objective' : 'theory'

          parsedQuestions.push({
            course,
            questionText,
            questionType,
            options
          })
        }
      }

      if (parsedQuestions.length === 0) {
        return res.status(400).json({ message: 'No valid questions found in file.' })
      }

      // Save questions and get their IDs
      const savedQuestions = await Question.insertMany(parsedQuestions)

      // Create the test
      const newTest = new Test({
        userId: adminId,
        course,
        questions: savedQuestions.map(q => q._id),
        answers: [], // You can populate this later
        totalScore: savedQuestions.length,
        status: 'new'
      })

      await newTest.save()

      res.status(201).json({
        message: 'Test created successfully',
        testId: newTest._id
      })
    } catch (error) {
      console.error('Error creating test:', error)
      res.status(500).json({
        message: 'Error creating test',
        error: error.message
      })
    }
  }
)


module.exports = router
