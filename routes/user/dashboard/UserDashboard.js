const express = require('express')
const router = express.Router()
const { protect } = require('../authentication/Authentication')
const Test = require('../../../models/Test')
const Course = require("../../../models/Courses")
const User = require("../../../models/User")
const mongoose = require("mongoose")

// Update user profile
router.put('/profile', protect, async (req, res) => {
  const { age } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (age) user.age = age;
    await user.save();
    res.json({ message: 'Profile updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all courses
router.get('/courses/list', async (req, res) => {
  try {
    const userCourse = await Course.find()
    if (!userCourse || userCourse.length === 0) {
      return res.status(404).json({ message: 'No courses found' })
    }
    const courseCount = userCourse.length
    res.json({ courses: userCourse, count: courseCount })
  } catch (error) {
    console.error('Error fetching courses:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Get all enrolled courses for a user
router.get('/courses', protect, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Ensure user exists
    const user = await User.findById(userId).populate('registeredCourses');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch courses where the user is registered
    const enrolledCourses = await Course.find({ registeredUsers: userId }).select('name description _id');

    return res.json({
      count: user.registeredCourses.length,
      courses: user.registeredCourses
    });

  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Route to get the course for a user
router.get('/courses/:courseId', protect, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    console.log('Requested courseId:', courseId);
    console.log('Authenticated userId:', userId);

    // Convert courseId to ObjectId
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }

    // Check if the user is registered for the course
    const user = await User.findById(userId).populate('registeredCourses');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const course = user.registeredCourses.find(
      (course) => course._id.toString() === courseId
    );

    if (!course) {
      return res.status(403).json({ message: "You are not registered for this course" });
    }

    res.status(200).json({ message: "User course found", course });
    console.log("User course found: ", course);
  } catch (error) {
    console.error('Error fetching course:', error.message, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to get tests for a particular course associated to a particular user
router.get('/courses/:courseId/tests', protect, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    // Check if the course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if the user is registered for the course
    const user = await User.findOne({
      _id: userId,
      registeredCourses: courseId
    });

    if (!user) {
      return res.status(403).json({ message: "You are not registered for this course" });
    }

    // Fetch tests linked to the course
    const tests = await Test.find({ course: courseId }).populate('questions');

    if (!tests || tests.length === 0) {
      return res.status(404).json({ message: "No tests available for this course" });
    }

    res.status(200).json({ message: "Course tests found", tests });
    console.log({ message: "Course tests found", tests });

  } catch (error) {
    console.error('Error fetching tests:', error);
    res.status(500).json({ message: "Server error" });
  }
});


// Route to get all new tests for a user
// router.get("/new", protect, async (req, res) => {
//   try {
//     const { userId } = req.params
//     const newTests = await Test.find({ status: "new", userId })
//     if (!newTests) {
//       return res.status(404).json({ message: "No new tests" })
//     }
//     res.status(200).json({ message: "New tests: ", newTests })
//   } catch (error) {
//     console.error('Error fetching new tests:', error)
//     res.status(500).json({ message: 'Server error' })
//   }
// })
module.exports = router

/*const express = require('express')
const router = express.Router()
const { protect } = require('./Authentication')
const User = require('../models/User')
const Question = require('../models/Question')
const Test = require('../models/Test')
const UserTest = require('../models/UserTest')
const Response = require('../models/Response')
const Results = require('../models/Results')
const Courses = require('../models/Courses')
const mongoose = require('mongoose')
const axios = require('axios')
require('dotenv').config()

// Get categories
router.get('/courses', async (req, res) => {
  try {
    const categories = await Courses.find()

    if (!categories || categories.length === 0) {
      return res.status(404).json({ message: 'No courses found' })
    }

    res.json(categories)
  } catch (error) {
    console.error('Error fetching courses:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Get user's test info
router.get('/test/info/:testId', protect, async (req, res) => {
  try {
    const { testId } = req.params
    const userId = req.user.id

    const test = await Test.findById(testId)

    if (!test) {
      return res.status(404).json({ message: 'Test not found.' })
    }

    // Get user's test record (if they have started it)
    const userTest = await UserTest.findOne({ userId, testId })

    if (!userTest) {
      return res.status(200).json({
        message: 'Test found but not started by the user.',
        test: {
          _id: test._id,
          title: test.title,
          description: test.description,
          duration: test.duration,
          status: 'undone'
        }
      })
    }

    res.status(200).json({
      success: true,
      test: {
        _id: test._id,
        title: test.title,
        description: test.description,
        duration: test.duration,
        status: userTest.status,
        startTime: userTest.startTime,
        endTime: userTest.endTime,
        score: userTest.status === 'completed' ? userTest.score : null
      }
    })
  } catch (error) {
    console.error('Error fetching test info:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Route to get all tests of a user
router.get('/tests/total/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params
    console.log(
      'Fetching total tests and total number of tests for user:',
      userId
    )

    const user = await User.findById(userId).populate('courseId')

    if (!user) {
      console.log(`User not found: ${userId}`)
      return res.status(404).json({ message: 'User or course not found' })
    }

    if (!user.courseId) {
      console.log(`User has no course assigned: ${userId}`)
      return res
        .status(404)
        .json({ message: 'User is not assigned to any course.' })
    }

    // if (!user || !user.courseId) {
    //   return res.status(404).json({ message: 'User or course not found.' })
    // }

    const tests = await Test.find({ courseId: user.courseId._id })
      .populate('courseId', 'title')
      .select('title createdAt courseId')
    console.log(`Test found ${tests}`)

    const totalTestsCount = tests.length

    console.log(`Total tests found: ${totalTestsCount} for user ${userId}`)

    res.status(200).json({
      message: `Total tests found: ${totalTestsCount}`,
      totalTests: tests,
      totalTestsCount
    })
  } catch (error) {
    console.error('Error fetching tests:', error)
    res.status(500).json({ message: 'Server error', error })
  }
})

// Route to get all undone tests for a user
router.get('/tests/active/:userId', protect, async (req, res) => {
  try {
    const userId = req.user.id
    const undoneTests = await Test.find({ userId, status: 'undone' })
    console.log('Undone tests response:', undoneTests)
    res
      .status(200)
      .json({ message: `Undone tests response: ${undoneTests}`, undoneTests })
  } catch (error) {
    console.error('Error fetching undone tests:', error)
    res.status(500).json({ message: 'Internal server error', error })
  }
})

// Get total number of undone tests for a user
router.get('/tests/active/count/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params
    console.log('Fetching active test count for user:', userId)

    const undoneTestCount = await Test.countDocuments({
      userId,
      status: 'undone'
    })
    console.log('Total undone tests:', undoneTestCount)

    res.status(200).json({ message: `Undone tests count: ${undoneTestCount}` })
  } catch (error) {
    console.error('Error fetching active test count:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Route to get info about an undone test for a user
router.get('/undone-test/:testId', protect, async (req, res) => {
  try {
    const { testId } = req.params
    const userId = req.user.id

    const undoneTest = await Test.findOne({
      _id: testId,
      user: userId,
      status: 'undone'
    })

    if (!undoneTest) {
      return res.status(404).json({ message: 'Test not found or completed' })
    }

    res
      .status(200)
      .json({ message: `Fetching undone tests ${undoneTest}`, undoneTest })
  } catch (error) {
    console.error('Error fetching undone tests:', error)
    res.status(500).json({ message: 'Internal server Error' })
  }
})

// Route to get total number of undone tests for a user
router.get('/tests/active/count/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params
    console.log('Fetching active test count for user:', userId)

    const undoneTestsCount = await Test.countDocuments({
      userId,
      status: 'completed'
    })
    console.log('Total undone tests:', undoneTestsCount)
    rs.status(200).json({
      message: `Total number of undone tests ${undoneTestsCount}`,
      undoneTestsCount
    })
  } catch (error) {
    console.error('Error fetching undone test count:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Route to get all completed tests for a user
router.get('/completed-test/:userId', protect, async (req, res) => {
  try {
    const userId = req.user.id

    const completedTests = await Test.find({ userId, status: 'completed' })
    console.log('Completed tests response:', completedTests)

    const completedTestsCount = await Test.countDocuments({
      userId,
      status: 'completed'
    })
    console.log('Total number of completed tests:', completedTestsCount)
    res.status(200).json({
      message: `Fetching user's completed tests ${completedTests} amd completed tests count ${completedTestsCount}`,
      completedTests,
      completedTestsCount
    })
  } catch (error) {
    console.error(
      `Error fetching completed tests ${completedTests} and completed tests count ${completedTestsCount}`,
      completedTests,
      completedTestsCount
    )
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Route to get info about a specific completed test for a user
router.get('/completed-test/:testId', protect, async (req, res) => {
  try {
    const { testId } = req.params
    const userId = req.user.id

    const test = await Test.findOne({
      _id: testId,
      user: userId,
      status: 'completed'
    })

    if (!test) {
      return res
        .status(404)
        .json({ message: 'Test not found or not completed' })
    }

    res.status(200).json({ message: `Fetching completed tests ${test}`, test })
  } catch (error) {
    console.error('Error fetching completed tests:', error)
    res.status(500).json({ message: 'Internal server Error' })
  }
})

// Route to start test
router.post('/test/start/:testId', protect, async (req, res) => {
  try {
    const { testId } = req.params
    const userId = req.user.id

    const user = await User.findById(userId)
    if (!user || !user.courseId) {
      return res.status(404).json({ message: 'User or course not found.' })
    }
    const test = await Test.findOne({ _id: testId, courseId: user.courseId })

    if (!test) {
      return res
        .status(403)
        .json({ message: 'Unauthorized. Test not found for your course.' })
    }

    // if (test.status === 'completed') {
    //   return res.status(404).json({ message: 'Test already completed' })
    // }

    const userTestRecord = await UserTest.findOne({ userId, testId })
    if (userTestRecord) {
      return res
        .status(400)
        .json({ message: 'Test already started or completed.' })
    }

    // if (!userTestRecord) {
    const startTime = new Date()
    const endTime = new Date(startTime.getTime() + test.duration * 60000)

    const userTestResponse = new UserTest({
      userId,
      testId,
      courseId: user.courseId,
      startTime,
      endTime,
      status: 'ongoing'
    })

    await userTestResponse.save()
    // }

    res.status(200).json({
      message: 'Test started successfully',
      testId,
      courseId: user.courseId,
      startTime,
      endTime,
      status: 'ongoing'
    })
  } catch (error) {
    console.error('Error starting test:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Route to submit test
router.post('/test/submit/:testId', protect, async (req, res) => {
  try {
    const { testId } = req.params
    const userId = req.user.id
    const { responses } = req.body

    const test = await Test.findById(testId).populate('courseId')
    if (!test) {
      return res.status(404).json({ message: 'Test not found' })
    }

    const user = await User.findById(userId)
    if (!user || !user.courses.includes(test.courseId._id)) {
      return res
        .status(403)
        .json({ message: 'Unauthorized: You cannot submit this test.' })
    }

    const existingSubmission = await Results.findOne({ userId, testId })
    if (existingSubmission) {
      return res.status(400).json({ message: 'Test already submitted.' })
    }

    const savedResponses = await Response.insertMany(
      responses.map(response => ({
        userId,
        testId,
        questionId: response.questionId,
        response: response.answer,
        isCorrect: response.isCorrect
      }))
    )

    const score = savedResponses.filter(res => res.isCorrect).length

    const testResult = new Results({
      userId,
      testId,
      courseId: test.courseId._id,
      score,
      totalQuestions: test.questions.length,
      status: 'completed'
    })

    await testResult.save()

    res.status(200).json({
      message: 'Test submitted successfully!',
      score,
      totalQuestions: test.questions.length
    })
  } catch (error) {
    console.error('Error submitting test:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})
/*    let userTest = await UserTest.findOne({ userId, testId })
    if (!userTest) {
      return res.status(400).json({ message: 'You have not started this test' })
    }
    if (userTest.status === 'completed') {
      return res
        .status(400)
        .json({ message: 'Test has already been submitted' })
    }
    const currentTime = new Date()
    if (currentTime > userTest.endTime) {
      return res.status(400).json({ message: 'Test time has expired' })
    }
    let totalScore = 0

    for (const useResponse of responses) {
      const { questionId, response } = userResponse
      const question = await Question.findById(questionId)

      if (!question) continue

      let isCorrect = false
      let pointsEarned = 0

      if (question.type === 'mcq') {
        isCorrect =
          response.trim().toLowerCase() ===
          question.correctAnswer.trim().toLowerCase()
        pointsEarned = isCorrect ? question.points : 0

        totalScore += pointsEarned

        await Response.create({
          userId,
          testId,
          questionId,
          response,
          isCorrect
        })
      }

     userTest.status = 'completed'
      userTest.score = totalScore
      userTest.submittedAt = new Date()
      await userTest.save()

      res
        .status(200)
        .json({ message: 'Test submitted successfully.', totalScore })
    }
  } catch (error) {
    console.error('Error submitting test:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})*/

module.exports = router

/*
// AI Grading Function
const gradeSubjectiveAnswers = async (testId, userId, subjectiveAnswers) => {
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
              content: `Question: ${ans.text}\nUser Answer: ${ans.answer}\nCorrect Answer: ${ans.correctAnswer}\n\nGrade the answer from 0 to 5, where 5 is completely correct and 0 is wrong. Explain why.`
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
      const rawScore = scoreMatch ? parseInt(scoreMatch[1]) : 0
      const finalScore = rawScore >= 3 ? 1 : 0

      ans.isCorrect = finalScore === 1
      ans.score = finalScore

      console.log(
        `Graded: ${ans.answer} => AI Score: ${rawScore}, Final Score: ${finalScore}`
      )
    }

    // Update only the subjective answers in the database
    await Results.updateOne(
      { testId, userId },
      {
        $set: {
          'answers.$[elem].isCorrect': true,
          'answers.$[elem].score': {
            $each: subjectiveAnswers.map(ans => ans.score)
          },
          totalSubjectiveScore: subjectiveAnswers.reduce(
            (sum, ans) => sum + ans.score,
            0
          ),
          subjectivePending: false
        }
      },
      {
        arrayFilters: [
          {
            'elem.questionId': {
              $in: subjectiveAnswers.map(ans => ans.questionId)
            }
          }
        ]
      }
    )

    console.log(`AI grading completed for test ${testId}`)
  } catch (error) {
    console.error('Error grading subjective answers:', error)
  }
}

// Get all tests and number of tests for a user
router.get('/tests/total/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params
    const tests = await Test.find({ userId })
      .populate('courseId', 'title')
      .select('title createdAt courseId')
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
      return res.status(500).json({ message: 'Invalid test ID format' })
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
      return res.status(500).json({ message: 'Invalid test ID format' })
    }

    const test = await Test.findById(testId)

    if (!test) {
      return res
        .status(404)
        .json({ message: 'Test not found or unauthorized access.' })
    }

    if (test.status === 'completed') {
      return res.status(500).json({ message: 'Test already completed.' })
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
      return res.status(500).json({ message: 'Test already completed' })
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
      return res.status(500).json({ message: 'Test already submitted' })
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
        questionText: question.text,
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
      totalScore: totalScore,
      scoreBreakdown: `${test.totalObjectiveScore}/${test.totalQuestionsAttempted} (Objective)`,
      subjectivePending: subjectiveAnswers.length > 0,
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
      console.log('Performance response:', response)
      return res.json(response)
    }

    const scores = completedTests.map(test => {
      let totalQuestionsAttempted = test.questions ? test.questions.length : 0

      if (!totalQuestionsAttempted && test.submissions) {
        totalQuestionsAttempted = test.submissions.length
      }

      let scoreBreakdown =
        totalQuestionsAttempted > 0
          ? `${test.totalScore}/${totalQuestionsAttempted}`
          : '0/0'

      return {
        testName: test.testName,
        totalScore: test.totalScore,
        totalQuestionsAttempted,
        scoreBreakdown,
        createdAt: test.createdAt
      }
    })

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
