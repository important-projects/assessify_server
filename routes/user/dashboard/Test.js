const express = require('express')
const router = express.Router()
const Question = require('../../../models/Question')
const Test = require('../../../models/Test')
const Courses = require('../../../models/Courses')
const { protect, isAdmin } = require('../authentication/Authentication')



// Get questions for a specific course
router.get('/test/questions/:category', protect, async (req, res) => {
  const category = req.params.category
  console.log('Category received:', category)
  try {
    const questions = await Question.aggregate([
      { $match: { category } },
      { $sample: { size: 40 } } // Sample 40 random questions
    ])
    console.log('Questions found:', questions)
    res.json(questions)
  } catch (error) {
    console.error('Error fetching questions:', error)
    res.status(500).json({ message: 'Error fetching questions', error })
  }
})

// Submit the test
router.post('/submit', protect, async (req, res) => {
  const { category, answers } = req.body
  const userId = req.user.id

  try {
    const gradedAnswers = await Promise.all(
      answers.map(async answer => {
        const question = await Question.findById(answer.questionId)

        if (!question) {
          throw new Error(`Question with ID ${answer.questionId} not found.`)
        }

        const isCorrect = answer.answer === question.correctAnswer
        const score = isCorrect ? 1 : 0

        return {
          questionId: answer.questionId,
          answer: answer.answer,
          correctAnswer: question.correctAnswer,
          category: question.category,
          isCorrect,
          score
        }
      })
    )

    // Calculate total score
    const totalScore = gradedAnswers.reduce(
      (acc, answer) => acc + answer.score,
      0
    )

    // Save the test in the database
    const test = new Test({
      userId,
      category,
      answers: gradedAnswers,
      totalScore
    })

    await test.save()

    // Respond with the graded answers and the total score
    res.status(201).json({
      message: 'Test submitted and graded successfully',
      totalScore,
      answers: gradedAnswers
    })
  } catch (error) {
    console.error('Error submitting test:', error)
    res
      .status(500)
      .json({ message: 'Error submitting test', error: error.message })
  }
})

// Get all tests submitted by all users (Admin Access Only)
router.get('/submitted', protect, isAdmin, async (req, res) => {
  try {
    const tests = await Test.find().populate('userId', 'username email')
    console.log('Retrieved tests:', tests)
    res.json(tests)
  } catch (error) {
    console.error('Error retrieving tests:', error)
    res
      .status(500)
      .json({ message: 'Error retrieving tests', error: error.message })
  }
})

// Get a specific test by ID (Admin Access Only)
router.get('/submitted/:id', protect, isAdmin, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
      .populate('userId', 'username email')
      .populate({
        path: 'answers.questionId',
        select: 'questionText category options correctAnswer' // Include fields relevant to display
      })

    if (!test) return res.status(404).json({ message: 'Test not found' })
    res.status(200).json(test)
  } catch (error) {
    console.error('Error retrieving test:', error)
    res
      .status(500)
      .json({ message: 'Error retrieving test', error: error.message })
  }
})

// Get all tests submitted by a user (Admin Access Only)
router.get('/submitted', protect, isAdmin, async (req, res) => {
  try {
    const tests = await Test.find().populate('userId', 'username email')
    console.log('Retrieved tests:', tests)

    res.json(tests)
  } catch (error) {
    console.error('Error retrieving tests:', error)
    res
      .status(500)
      .json({ message: 'Error retrieving tests', error: error.message })
  }
})

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


// Get all test results for the user
router.get('/test/results', protect, async (req, res) => {
  try {
    // Fetch all tests that belong to the logged-in user
    const tests = await Test.find({ userId: req.user.id }).populate(
      'userId',
      'username email'
    )

    res.json(tests)
  } catch (error) {
    console.error('Error retrieving user test results:', error)
    res
      .status(500)
      .json({ message: 'Error retrieving test results', error: error.message })
  }
})

// Get detailed result of a specific test
router.get('/test/result/:id', protect, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
      .populate('userId', 'username email')
      .populate({
        path: 'answers.questionId',
        select: 'questionText category options correctAnswer'
      })
    if (!test)
      return res
        .status(404)
        .json({ message: 'Test not found or unauthorized access.' })

    res.json(test)
  } catch (error) {
    console.error('Error retrieving test details:', error)
    res
      .status(500)
      .json({ message: 'Error retrieving test details', error: error.message })
  }
})

// Get top 10 test scores for the logged-in user
router.get('/test/top10', protect, async (req, res) => {
  try {
    const topScores = await Test.find({ userId: req.user.id })
      .sort({ totalScore: -1 })
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

module.exports = router
