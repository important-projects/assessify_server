const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mongoose = require('mongoose');
const path = require('path');

const Question = require('../../models/Question');
const Test = require('../../models/Test');
const Course = require("../../models/Courses")
const { protect } = require('../user/authentication/Authentication');
const { isAdmin } = require('./authentication/Authentication');

// Multer configuration for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/'
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'), false);
  }
}

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilter
});

// Utility function to parse PDF questions
const extractQuestionsFromPdf = async (filePath, course) => {
  try {
    const buffer = fs.readFileSync(filePath);
    const { text } = await pdfParse(buffer);

    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    const questions = [];
    let currentQuestion = null;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/^Question:\s*(.+)/i)) {
        // Save previous question if exists
        if (currentQuestion) {
          questions.push(currentQuestion);
        }

        currentQuestion = {
          course,
          questionText: lines[i].replace(/^Question:\s*/i, '').trim(),
          options: [],
          answer: null,
          questionType: 'theory'
        };
      } else if (currentQuestion && lines[i].match(/^Options:/i)) {
        currentQuestion.questionType = 'objective';
      }
      else if (currentQuestion && /^[a-dA-D]\.\s*.+/.test(lines[i])) {
        currentQuestion.options.push(lines[i].trim());
      }
      // Handle answers if present (e.g., "Answer: B")
      else if (currentQuestion && lines[i].match(/^Answer:\s*([a-dA-D])/i)) {
        const match = lines[i].match(/^Answer:\s*([a-dA-D])/i);
        currentQuestion.correctAnswer = match[1].toUpperCase();
      }
    }

    // Add the last question if exists
    if (currentQuestion) {
      questions.push(currentQuestion);
    }
    return questions;
  } catch (error) {
    throw new Error(`Failed to parse PDF: ${error.message}`);
  } finally {
    // Clean up the file after processing
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};

// === ROUTES === //

// Create test (admin only, with file upload)
router.post(
  '/tests/create',
  protect,
  isAdmin,
  upload.single('file'),
  async (req, res) => {
    const {
      testName,
      course,
      courseCode,
      level,
      duration,
      question,
      startTime,
      endTime
    } = req.body;
    const file = req.file;
    const adminId = req.user.id;

    // Input validation
    if (!testName || !course || !courseCode || !level || !duration || !startTime || !endTime) {
      if (file) fs.unlinkSync(file.path);
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(course)) {
      if (file) fs.unlinkSync(file.path);
      return res.status(400).json({ message: 'Invalid course ID' });
    }

    // Check if course exists
    try {
      const courseExists = await Course.exists({ _id: course });
      if (!courseExists) {
        if (file) fs.unlinkSync(file.path);
        return res.status(404).json({ message: 'Course not found' });
      }
    } catch (err) {
      if (file) fs.unlinkSync(file.path);
      return res.status(500).json({ message: 'Error checking course', error: err.message });
    }

    let savedQuestions = [];

    try {
      // Handle file upload case
      if (file) {
        // File type validation is already handled by multer filter
        const extractedQuestions = await extractQuestionsFromPdf(file.path, course);

        if (!extractedQuestions.length) {
          fs.unlinkSync(file.path);
          return res.status(400).json({ message: 'No questions found in file' });
        }

        savedQuestions = await Question.insertMany(
          extractedQuestions.map(q => ({ ...q, course }))
        );
      }
      // Handle direct questions case
      else if (question) {
        try {
          const parsedQuestions = JSON.parse(question);

          if (!Array.isArray(parsedQuestions)) {
            return res.status(400).json({ message: 'Questions must be an array' });
          }

          if (parsedQuestions.length === 0) {
            return res.status(400).json({ message: 'Questions array cannot be empty' });
          }

          savedQuestions = await Question.insertMany(
            parsedQuestions.map(q => ({ ...q, course }))
          );
        } catch (err) {
          return res.status(400).json({
            message: 'Invalid questions format',
            error: err.message
          });
        }
      }
      // No questions provided
      else {
        return res.status(400).json({ message: 'No questions provided' });
      }

      // Create the test
      const newTest = new Test({
        userId: adminId,
        testName,
        course,
        courseCode,
        level,
        duration: Number(duration),
        questions: savedQuestions.map(q => q._id),
        totalScore: savedQuestions.length,
        status: 'new',
        startTime: new Date(startTime),
        endTime: new Date(endTime)
      });

      await newTest.save();

      // Clean up file after successful processing
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return res.status(201).json({
        message: 'Test created successfully',
        testId: newTest._id,
        questionCount: savedQuestions.length
      });

    } catch (err) {
      console.error('Test creation error:', err);

      // Clean up any uploaded file in case of error
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return res.status(500).json({
        message: 'Internal server error',
        error: err.message
      });
    }
  }
);

// Get all test results (admin only)
router.get('/results', protect, isAdmin, async (_, res) => {
  try {
    const results = await Test.find({ userId: { $ne: null } }).populate('userId', 'username email');
    res.json(results);
  } catch (err) {
    console.error('Error fetching results:', err);
    res.status(500).json({ message: 'Error retrieving scores', error: err.message });
  }
});

// Get top 10 scores
router.get('/top10', protect, isAdmin, async (_, res) => {
  try {
    const scores = await Test.find()
      .sort({ totalScore: -1 })
      .limit(10)
      .populate('userId', 'username email');
    res.json(scores);
  } catch (err) {
    console.error('Error fetching top scores:', err);
    res.status(500).json({ message: 'Error retrieving top scores', error: err.message });
  }
});

// Get all available courses

router.get("/courses/list", async (req, res) => {
  try {
    const userCourses = await Course.find();
    if (!userCourses || userCourses.length === 0) {
      return res.status(404).json({ message: "No courses found" });
    }

    const courseCount = userCourses.length;
    console.log("Total courses found:", courseCount, userCourses);
    res.json({ courses: userCourses, count: courseCount });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Pie chart data by category
router.get('/pieData', protect, isAdmin, async (_, res) => {
  try {
    const aggregated = await Test.aggregate([
      { $unwind: '$answers' },
      { $group: { _id: '$answers.category', count: { $sum: 1 } } }
    ]);

    const labels = aggregated.map(item => item._id);
    const values = aggregated.map(item => item.count);

    res.json({ labels, values });
  } catch (err) {
    console.error('Error fetching pie data:', err);
    res.status(500).json({ message: 'Error retrieving pie chart data', error: err.message });
  }
});

// Leaderboard (top 10 users by total score)
router.get('/leaderboard', protect, isAdmin, async (_, res) => {
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
    ]);

    res.json(leaderboard);
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ message: 'Error retrieving leaderboard', error: err.message });
  }
});

module.exports = router;
