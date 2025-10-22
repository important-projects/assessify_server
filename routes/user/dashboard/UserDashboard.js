const express = require("express");
const router = express.Router();
const NodeCache = require("node-cache");
const answerCache = new NodeCache({ stdTTL: 3600 });
const { protect } = require("../authentication/Authentication");
const Test = require("../../../models/Test");
const Course = require("../../../models/Courses");
const User = require("../../../models/User");
const mongoose = require("mongoose");
const Question = require("../../../models/Question");
const TestSubmission = require("../../../models/TestSubmission");
const Response = require("../../../models/Response");
const Results = require("../../../models/Results");
const {
  processAnswers,
  saveTestSubmission,
  saveTestResults,
  buildSuccessResponse,
} = require("../../../utils/gradingHelpers");

// ========================================
// Update user profile
// ========================================
router.put("/profile", protect, async (req, res) => {
  const { age } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (age) {
      user.age = age;
    }
    await user.save();

    res.json({ message: "Profile updated", user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ========================================
// Get all available courses
// ========================================
router.get("/courses/list", async (req, res) => {
  try {
    const userCourses = await Course.find();
    if (!userCourses || userCourses.length === 0) {
      return res.status(404).json({ message: "No courses found" });
    }

    const courseCount = userCourses.length;
    res.json({ courses: userCourses, count: courseCount });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ========================================
// Get all enrolled courses for a user
// ========================================
router.get("/courses", protect, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(userId).populate("registeredCourses");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      count: user.registeredCourses.length,
      courses: user.registeredCourses,
    });
  } catch (error) {
    console.error("Error fetching enrolled courses:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ========================================
// Get a single course for a user
// ========================================
router.get("/courses/:courseId", protect, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }

    const user = await User.findById(userId).populate("registeredCourses");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const course = user.registeredCourses.find(
      (course) => course._id.toString() === courseId
    );

    if (!course) {
      return res
        .status(403)
        .json({ message: "You are not registered for this course" });
    }

    res.status(200).json({ message: "User course found", course });
  } catch (error) {
    console.error("Error fetching course:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ========================================
// Get all tests for a course for a user
// ========================================
router.get("/courses/test/:courseId", protect, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    if (
      !courseId ||
      !userId ||
      !mongoose.Types.ObjectId.isValid(courseId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({ message: "Invalid course or user ID" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(403).json({ message: "Unauthorized user" });
    }

    const tests = await Test.find({ course: courseId }).populate("questions");

    // Fetch all user's test submissions for this course
    const submissions = await TestSubmission.find({ user: userId }).select(
      "test status"
    );

    // Create a map for faster lookup
    const submissionMap = new Map();
    submissions.forEach((sub) => {
      submissionMap.set(sub.test.toString(), sub.status);
    });

    // Attach user-specific status to each test
    const testsWithUserStatus = tests.map((test) => {
      const userStatus = submissionMap.get(test._id.toString()) || "new";
      return {
        ...test.toObject(),
        userStatus,
      };
    });

    console.log(course, testsWithUserStatus);
    res.status(200).json({
      message: "Course tests found",
      course,
      tests: testsWithUserStatus,
    });
  } catch (error) {
    console.error("Error fetching tests: ", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/courses/view-test/:testId", protect, async (req, res) => {
  try {
    const { testId } = req.params;
    const userId = req.user.id;
    console.log(userId + "User Id", testId + "Course Id");
    // if (!mongoose.Types.ObjectId.isValid(testId)) {
    //   return res.status(400).json({ message: 'Invalid course ID' });
    // }
    if (
      !testId ||
      !userId ||
      !mongoose.Types.ObjectId.isValid(testId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({ message: "Invalid test or user ID" });
    }

    const test = await Test.findById(testId);
    console.log(test + "Test");
    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    const user = await User.findOne({
      _id: userId,
      // registeredCourses: testId,
    });
    console.log(user + "User");

    if (!user) {
      return res
        .status(403)
        .json({ message: "You are not registered for this course" });
    }

    const tests = await Test.findById(testId).populate("questions");
    console.log("Tests" + tests);

    // if (!tests || tests.length === 0) {
    //   return res
    //     .status(404)
    //     .json({ message: "No tests available for this course" });
    // }

    res.status(200).json({
      message: "Tests found",
      tests,
    });
  } catch (error) {
    console.error("Error fetching tests: ", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/test/start/:testId", protect, async (req, res) => {
  try {
    const { testId } = req.params;
    const userId = req.user.id;

    console.log(`Starting test for user ${userId} with test ID ${testId}`);

    // Validate testId
    if (!mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(400).json({ message: "Invalid test ID" });
    }

    // Fetch user and validate
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch test and ensure it belongs to one of the user's registered courses
    const test = await Test.findOne({
      _id: testId,
      course: { $in: user.registeredCourses.map((c) => c._id) },
    });
    if (!test) {
      return res
        .status(403)
        .json({ message: "Test not found or not accessible for your courses" });
    }

    // Check if test is already completed
    if (test.status === "completed") {
      return res.status(400).json({ message: "Test is already completed" });
    }

    // Check if user has already started or completed the test
    const userTestRecord = await TestSubmission.findOne({
      user: userId,
      test: testId,
    });
    if (userTestRecord) {
      return res
        .status(400)
        .json({ message: "Test already started or completed" });
    }

    // Set startTime and endTime
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + test.duration * 60 * 1000);

    // Create new TestSubmission record
    const userTestResponse = new TestSubmission({
      user: userId,
      test: testId,
      course: test.course,
      startTime,
      endTime,
      level: test.level,
      duration: test.duration,
      status: "ongoing",
      // answer: test.answers, questions: test.questions
    });

    await userTestResponse.save();
    console.log(
      `TestSubmission saved: ${userTestResponse._id} for user ${userId}`
    );

    // Add submission to user's testSubmissions
    user.testSubmissions.push(userTestResponse._id);
    await user.save({ validateBeforeSave: false });

    test.status = "ongoing";
    await test.save();

    // Respond with test details
    res.status(200).json({
      message: "Test started successfully",
      testId,
      testName: test.testName,
      courseId: test.course,
      duration: test.duration,
      startTime,
      endTime,
      level: test.level,
      duration: test.duration,
      questions: test.questions,
      totalScore: test.totalScore,
      status: "ongoing",
    });
  } catch (error) {
    console.error("Error starting test:", error);
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation error", error: error.message });
    }
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ message: "Invalid ID format", error: error.message });
    }
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

router.get("/test/questions/:testId", protect, async (req, res) => {
  try {
    const { testId } = req.params;
    console.log("Fetching questions for test ID:", testId);

    if (!mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(400).json({ message: "Invalid test ID" });
    }

    const test = await Test.findById(testId).populate("questions");
    console.log("Fetched Test:", test);

    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    console.log("Fetched Questions:", test.questions);
    res.status(200).json({ questions: test.questions });
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/submit-test/:testId", protect, async (req, res) => {
  try {
    const { testId } = req.params;
    const { answers } = req.body;
    const userId = req.user.id;

    // Input validation
    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: "Answers must be provided as an array",
      });
    }

    const [test, user] = await Promise.all([
      Test.findById(testId).populate("questions"),
      User.findById(userId),
    ]);

    if (!test || !user) {
      return res.status(404).json({
        success: false,
        message: "Test or user not found",
      });
    }

    const isPremiumUser = user.isPremium() && user.hasActiveSubscription();
    const processingResults = await processAnswers(
      userId,
      testId,
      answers,
      test.questions,
      isPremiumUser
    );

    // Save all data
    const [submission, testResults] = await Promise.all([
      saveTestSubmission(userId, testId, processingResults),
      saveTestResults(userId, testId, test.course, {
        ...processingResults,
        answers: answers,
      }),
    ]);

    console.log(submission, testResults);

    // Prepare response
    const response = buildSuccessResponse(test, processingResults);
    res.json(response);
  } catch (error) {
    console.error("Test submission failed:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// AI Grading Service (mock implementation)
// async function gradeWithAI(question, answer) {
//   // In a real implementation, you would call an AI service API here
//   // This is a mock implementation for demonstration

//   // Simulate API call delay
//   await new Promise(resolve => setTimeout(resolve, 1000));

//   // Analyze answer length
//   const wordCount = answer.trim().split(/\s+/).length;
//   const lengthScore = Math.min(wordCount / 20, 1) * 0.4; // 40% weight

//   // Keyword analysis
//   const matchedKeywords = question.keywords?.filter(keyword =>
//     answer.toLowerCase().includes(keyword.toLowerCase())
//   ) || [];
//   const keywordScore = (matchedKeywords.length / (question.keywords?.length || 1)) * 0.3; // 30% weight

//   // Conceptual understanding (simulated AI analysis)
//   const conceptScore = Math.random() * 0.3; // 30% weight (simulated)

//   const totalScore = (lengthScore + keywordScore + conceptScore) * question.points;

//   return {
//     score: Math.round(totalScore * 10) / 10,
//     feedback: generateAIFeedback(question, answer, matchedKeywords)
//   };
// }

/*function generateAIFeedback(question, answer, matchedKeywords) {
  const feedback = [];
  const wordCount = answer.trim().split(/\s+/).length;

  if (wordCount < 20) {
    feedback.push(`Your answer could be more detailed (currently ${wordCount} words)`);
  }

  if (matchedKeywords.length < (question.keywords?.length || 0)) {
    const missingKeywords = question.keywords?.filter(k => !matchedKeywords.includes(k));
    feedback.push(`Consider discussing: ${missingKeywords?.join(', ')}`);
  }

  feedback.push("AI analysis suggests room for deeper explanation of concepts");

  return feedback.join('. ');
}
*/

// function gradeObjectiveQuestion(question, answer) {
//   const isCorrect = answer.trim().charAt(0).toUpperCase() ===
//     question.correctAnswer.trim().charAt(0).toUpperCase();
//   return {
//     score: isCorrect ? (question.points || 1) : 0,
//     feedback: isCorrect ? "Correct answer" : "Incorrect answer",
//     isCorrect,
//     conceptsAddressed: [],
//     improvementAreas: []
//   };
// }

// function basicTheoryGrading(question, answer) {
//   const wordCount = answer.split(/\s+/).length;
//   const minWords = question.minWords || 20;
//   const keywords = question.keywords || [];

//   const matchedKeywords = keywords.filter(kw =>
//     answer.toLowerCase().includes(kw.toLowerCase())
//   );

//   const score = Math.min(
//     (wordCount / minWords * 0.5) +
//     (matchedKeywords.length / keywords.length * 0.5 || 0.3),
//     1
//   ) * (question.points || 5);

//   return {
//     score: Math.round(score),
//     feedback: `Basic evaluation: ${wordCount} words, ${matchedKeywords.length}/${keywords.length} keywords`,
//     conceptsAddressed: matchedKeywords,
//     improvementAreas: keywords.filter(kw => !matchedKeywords.includes(kw)),
//     isCorrect: score >= (question.points || 5) * 0.7
//   };
// }

// router.post('/submit-test/:testId', protect, async (req, res) => {
//   try {
//     const { testId } = req.params;
//     const { answers } = req.body;
//     const userId = req.user.id;
//     console.log(`User ID ${userId}` + `Answers received ${answers}` + `Test ID ${testId}`)

//     // Validation
//     if (!Array.isArray(answers)) {
//       return res.status(400).json({ success: false, message: 'Invalid answers format' });
//     }

//     if (!userId) {
//       return res.status(401).json({ success: false, message: 'Unauthorized' });
//     }

//     const test = await Test.findById(testId).populate('questions');
//     if (!test) {
//       return res.status(404).json({ success: false, message: 'Test not found' });
//     }

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }

//     console.log(`User  ${user} ` + `Test   ${test}` + `User ID ${userId}`)
//     const isPremiumUser = user?.subscription?.status === 'active';

//     // Process answers
//     let totalScore = 0;
//     const answerDetails = [];
//     const savedResponses = [];
//     let aiFailures = 0;

//     for (const { questionId, answer } of answers) {
//       const question = test.questions.find(q => q._id.equals(questionId));
//       if (!question) continue;

//       const maxPoints = question.points || (question.questionType === 'objective' ? 1 : 5);
//       let result;

//       if (question.questionType === 'objective') {
//         // Objective grading
//         const isCorrect = answer.trim().charAt(0).toUpperCase() ===
//           question.correctAnswer.trim().charAt(0).toUpperCase();
//         result = {
//           score: isCorrect ? maxPoints : 0,
//           feedback: isCorrect ? 'Correct answer' : 'Incorrect answer',
//           isCorrect,
//           conceptsAddressed: [],
//           improvementAreas: [],
//           gradedWithAI: false
//         };
//       } else {
//         // Theory grading
//         try {
//           const aiResult = await gradeWithAI(question, answer, maxPoints);
//           if (aiResult?.success) {
//             result = {
//               ...aiResult,
//               isCorrect: aiResult.score >= maxPoints * 0.7,
//               gradedWithAI: isPremiumUser
//             };
//           } else {
//             throw new Error('AI grading failed');
//           }
//         } catch (error) {
//           aiFailures++;
//           result = basicTheoryGrading(question, answer, maxPoints);
//           result.gradedWithAI = false;
//           result.isCorrect = result.score >= maxPoints * 0.7;
//         }
//       }

//       // Save response - ensure userId is properly included
//       const response = await Response.create({
//         userId: userId, // Explicitly setting userId
//         testId,
//         question: questionId,
//         answer,
//         isCorrect: result.isCorrect,
//         pointsEarned: result.score,
//         maxPoints,
//         feedback: result.feedback,
//         conceptsAddressed: result.conceptsAddressed,
//         improvementAreas: result.improvementAreas,
//         questionType: question.questionType,
//         gradedWithAI: result.gradedWithAI
//       });
//       console.log(response)

//       savedResponses.push(response._id);
//       answerDetails.push({
//         questionId,
//         questionText: question.questionText,
//         questionType: question.questionType,
//         submittedAnswer: answer,
//         correctAnswer: question.questionType === 'objective' ? question.correctAnswer : null,
//         isCorrect: result.isCorrect,
//         pointsEarned: result.score,
//         maxPoints,
//         feedback: result.feedback,
//         conceptsAddressed: result.conceptsAddressed,
//         improvementAreas: result.improvementAreas,
//         gradedWithAI: result.gradedWithAI
//       });

//       console.log(savedResponses)

//       totalScore += result.score;
//     }

//     // Update or create test submission
//     const submission = await TestSubmission.findOneAndUpdate(
//       { user: userId, test: testId },
//       {
//         user: userId, // Ensure user is set
//         test: testId,
//         status: 'completed',
//         score: totalScore,
//         submittedAt: new Date(),
//         answers: answerDetails
//       },
//       { new: true, upsert: true }
//     );

//     console.log(submission)
//     // Save results
//     const testResults = await Results.create({
//       userId: userId, // Explicitly setting userId
//       testId,
//       courseId: test.course,
//       score: totalScore,
//       totalPossibleScore: test.questions.reduce((sum, q) => sum + (q.points || (q.questionType === 'objective' ? 1 : 5)), 0),
//       totalQuestions: test.questions.length,
//       status: 'completed',
//       aiFailures,
//       answers
//     });

//     console.log(testResults)

//     res.json({
//       success: true,
//       totalScore,
//       totalPossibleScore: test.questions.reduce((sum, q) => sum + (q.points || (q.questionType === 'objective' ? 1 : 5)), 0),
//       answerDetails,
//       aiFailures,
//       gradingSystem: {
//         theory: {
//           criteria: ['answer_length', 'keyword_matching'],
//           minWords: 20
//         }
//       }
//     });

//     console.log(
//       totalScore,
//       test.questions.reduce((sum, q) => sum + (q.points || (q.questionType === 'objective' ? 1 : 5)), 0),
//       answerDetails,
//       aiFailures,
//       {
//         gradingSystem: {
//           theory: {
//             criteria: ['answer_length', 'keyword_matching'],
//             minWords: 20
//           }
//         }
//       }
//     )

//   } catch (error) {
//     console.error('Submission error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: error.message
//     });
//   }
// });

router.post("/submit-test/:testId", protect, async (req, res) => {
  try {
    const { testId } = req.params;
    const { answers } = req.body;
    const userId = req.user.id;

    // Input validation
    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: "Answers must be provided as an array",
      });
    }

    const [test, user] = await Promise.all([
      Test.findById(testId).populate("questions"),
      User.findById(userId),
    ]);

    if (!test || !user) {
      return res.status(404).json({
        success: false,
        message: "Test or user not found",
      });
    }

    const isPremiumUser = user?.subscription?.status === "active";
    const processingResults = await processAnswers(
      userId,
      testId,
      answers,
      test.questions,
      isPremiumUser
    );

    // Save all data
    const [submission, testResults] = await Promise.all([
      saveTestSubmission(userId, testId, processingResults),
      saveTestResults(userId, testId, test.course, {
        ...processingResults,
        answers: answers,
      }),
    ]);

    // Prepare response
    const response = buildSuccessResponse(test, processingResults);
    res.json(response);
  } catch (error) {
    console.error("Test submission failed:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

router.post("/tests/detail", protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const getTestForUser = await Test.find({ userId: userId }).populate(
      "questions",
      "course",
      "courseCode",
      "testName",
      "level",
      "startTime",
      "endTime",
      "createdAt",
      "duration",
      "status"
    );
    console.log(getTestForUser);

    res.json(getTestForUser);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
    console.log(error);
  }
});

// Get all responses needing manual grading
router.get("/grading/pending", protect, async (req, res) => {
  try {
    const responses = await Response.find({ needsManualGrading: true })
      .populate("userId", "name email")
      .populate("question")
      .populate("testId");

    res.json(responses);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update manual grading
router.put("/grading/:responseId", protect, async (req, res) => {
  try {
    const { responseId } = req.params;
    const { pointsEarned, feedback } = req.body;

    const response = await Response.findById(responseId);
    if (!response) {
      return res.status(404).json({ message: "Response not found" });
    }

    response.pointsEarned = pointsEarned;
    response.feedback = feedback;
    response.needsManualGrading = false;
    response.gradedAt = new Date();
    response.gradedBy = req.user.id;
    await response.save();

    // Update the test submission total score
    await TestSubmission.updateOne(
      { _id: response.testId, responses: responseId },
      { $inc: { score: pointsEarned - (response.pointsEarned || 0) } }
    );

    res.json({ message: "Grading updated", response });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

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
// module.exports = router

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
