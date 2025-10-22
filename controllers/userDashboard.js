const NodeCache = require("node-cache");
const fs = require("fs");

const Test = require("../models/test");
const User = require("../models/user");
const TestSubmission = require("../models/testSubmission");
const Results = require("../models/results");
const Response = require("../models/response");
const Course = require("../models/courses");
const Question = require("../models/question");

const {
  processAnswers,
  saveTestSubmission,
  saveTestResults,
  buildSuccessResponse,
} = require("../utils/testGrading");

const mongoose = require("mongoose");
const { extractQuestionsFromPdf } = require("../utils/mediaUpload");
const user = require("../models/user");

require("dotenv").config();

const userDashboardController = {
  userProfile: async (req, res) => {
    const { age } = req.body;
    try {
      const user = await User.findById(req.user.id);
      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "User not found" });

      if (age) user.age = age;
      await user.save();

      res.status(200).json({ success: true, message: "Profile updated", user });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  courseList: async (req, res) => {
    try {
      const userCourses = await Course.find();
      if (!userCourses || userCourses.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "No courses found" });
      }

      const courseCount = userCourses.length;
      res.status(200).json({
        success: true,
        message: "Course fetched",
        courses: userCourses,
        count: courseCount,
      });
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  userCourses: async (req, res) => {
    try {
      const userId = req.user?.id;

      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid user ID" });
      }

      const user = await User.findById(userId).populate("registeredCourses");
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "success:false,User not found" });
      }

      return res.status(200).json({
        success: true,
        message: "User courses fetched",
        count: user.registeredCourses.length,
        courses: user.registeredCourses,
      });
    } catch (error) {
      console.error("Error fetching enrolled courses:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  userCourseById: async (req, res) => {
    try {
      const { courseId } = req.params;
      const userId = req.user.id;

      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid course ID" });
      }

      const user = await User.findById(userId).populate("registeredCourses");
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      const course = user.registeredCourses.find(
        (course) => course._id.toString() === courseId
      );

      if (!course) {
        return res.status(403).json({
          success: false,
          message: "You are not registered for this course",
        });
      }

      res
        .status(200)
        .json({ success: true, message: "User course found", course });
    } catch (error) {
      console.error("Error fetching course:", error.message);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  userCreateTest: async (req, res) => {
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);
    const {
      testName,
      course,
      courseCode,
      level,
      duration,
      question,
      startTime,
      endTime,
    } = req.body;
    const file = req.file;
    const adminId = req.user.id;

    // Function to safely delete file
    const safeUnlink = (filePath) => {
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error(`Failed to delete file ${filePath}:`, err);
        }
      }
    };

    // Input validation
    if (
      !testName ||
      !course ||
      !courseCode ||
      !level ||
      !duration ||
      !startTime ||
      !endTime 
    ) {
      if (file) safeUnlink(file.path);
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(course)) {
      if (file) safeUnlink(file.path);
      return res
        .status(400)
        .json({ success: false, message: "Invalid course ID" });
    }

    // Check if course exists
    try {
      const courseExists = await Course.exists({ _id: course });
      if (!courseExists) {
        if (file) safeUnlink(file.path);
        return res
          .status(404)
          .json({ success: false, message: "Course not found" });
      }
    } catch (err) {
      if (file) safeUnlink(file.path);
      return res.status(500).json({
        success: false,
        message: "Error checking course",
        error: err.message,
      });
    }

    // const isPremiumUser =
    //   req.user.isPremium() && req.user.hasActiveSubscription();

    // if (isPremiumUser) {
    let savedQuestions = [];

    try {
      // Handle file upload case
      if (file) {
        const extractedQuestions = await extractQuestionsFromPdf(
          file.path,
          course
        );

        console.log(extractedQuestions);

        if (!extractedQuestions.length) {
          safeUnlink(file.path);
          return res
            .status(400)
            .json({ success: false, message: "No questions found in file" });
        }

        savedQuestions = await Question.insertMany(
          extractedQuestions.map((q) => ({ ...q, course }))
        );
      }
      // Handle direct questions case
      else if (question) {
        try {
          const parsedQuestions = JSON.parse(question);

          if (!Array.isArray(parsedQuestions)) {
            return res
              .status(400)
              .json({ message: "Questions must be an array" });
          }

          if (parsedQuestions.length === 0) {
            return res
              .status(400)
              .json({ message: "Questions array cannot be empty" });
          }

          savedQuestions = await Question.insertMany(
            parsedQuestions.map((q) => ({ ...q, course }))
          );
        } catch (err) {
          return res.status(400).json({
            success: false,
            message: "Invalid questions format",
            error: err.message,
          });
        }
      }
      // No questions provided
      else {
        return res
          .status(400)
          .json({ success: false, message: "No questions provided" });
      }

      // Create the test
      const newTest = new Test({
        userId: adminId,
        testName,
        course,
        courseCode,
        level,
        duration: Number(duration),
        questions: savedQuestions.map((q) => q._id),
        totalScore: savedQuestions.length,
        status: "new",
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      });

      await newTest.save();

      // Clean up file after successful processing
      if (file) safeUnlink(file.path);

      return res.status(201).json({
        success: true,
        message: "Test created successfully",
        testId: newTest._id,
        questionCount: savedQuestions.length,
      });
    } catch (err) {
      console.error("Test creation error:", err);
      if (file) safeUnlink(file.path);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: err.message,
      });
    }
    // } else {
    //   if (file) safeUnlink(file.path);
    //   return res.status(500).json({
    //     success: false,
    //     message: "Feature locked. Kindly subscribe to access this feature.",
    //   });
    // }
  },

  userTest: async (req, res) => {
    try {
      const { courseId } = req.params;
      const userId = req.user.id;

      if (
        !courseId ||
        !userId ||
        !mongoose.Types.ObjectId.isValid(courseId) ||
        !mongoose.Types.ObjectId.isValid(userId)
      ) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid course or user ID" });
      }

      const course = await Course.findById(courseId);
      if (!course) {
        return res
          .status(404)
          .json({ success: false, message: "Course not found" });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res
          .status(403)
          .json({ success: false, message: "Unauthorized user" });
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
        success: true,
        message: "Course tests found",
        course,
        tests: testsWithUserStatus,
      });
    } catch (error) {
      console.error("Error fetching tests: ", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  viewUserTest: async (req, res) => {
    try {
      const { testId } = req.params;
      const userId = req.user.id;
      console.log(userId + "User Id", testId + "Course Id");

      if (
        !testId ||
        !userId ||
        !mongoose.Types.ObjectId.isValid(testId) ||
        !mongoose.Types.ObjectId.isValid(userId)
      ) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid test or user ID" });
      }

      const test = await Test.findById(testId);
      console.log(test + "Test");
      if (!test) {
        return res
          .status(404)
          .json({ success: false, message: "Test not found" });
      }

      const user = await User.findOne({
        _id: userId,
      });
      console.log(user + "User");

      if (!user) {
        return res.status(403).json({
          success: false,
          message: "You are not registered for this course",
        });
      }

      const tests = await Test.findById(testId).populate("questions");
      console.log("Tests" + tests);

      res.status(200).json({
        success: true,
        message: "Tests found",
        tests,
      });
    } catch (error) {
      console.error("Error fetching tests: ", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  startUserTest: async (req, res) => {
    try {
      const { testId } = req.params;
      const userId = req.user.id;

      console.log(`Starting test for user ${userId} with test ID ${testId}`);

      // Validate testId
      if (!mongoose.Types.ObjectId.isValid(testId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid test ID" });
      }

      // Fetch user and validate
      const user = await User.findById(userId);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // Fetch test and ensure it belongs to one of the user's registered courses
      const test = await Test.findOne({
        _id: testId,
        course: { $in: user.registeredCourses.map((c) => c._id) },
      });
      if (!test) {
        return res.status(403).json({
          success: false,
          message: "Test not found or not accessible for your courses",
        });
      }

      // Check if test is already completed
      if (test.status === "completed") {
        return res
          .status(400)
          .json({ success: false, message: "Test is already completed" });
      }

      // Check if user has already started or completed the test
      const userTestRecord = await TestSubmission.findOne({
        user: userId,
        test: testId,
      });
      if (userTestRecord) {
        return res.status(400).json({
          success: false,
          message: "Test already started or completed",
        });
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
        return res.status(400).json({
          success: false,
          message: "Validation error",
          error: error.message,
        });
      }
      if (error.name === "CastError") {
        return res.status(400).json({
          success: false,
          message: "Invalid ID format",
          error: error.message,
        });
      }
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  getUserQuestions: async (req, res) => {
    try {
      const { testId } = req.params;
      console.log("Fetching questions for test ID:", testId);

      if (!mongoose.Types.ObjectId.isValid(testId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid test ID" });
      }

      const test = await Test.findById(testId).populate("questions");
      console.log("Fetched Test:", test);

      if (!test) {
        return res
          .status(404)
          .json({ success: false, message: "Test not found" });
      }

      console.log("Fetched Questions:", test.questions);
      res.status(200).json({ success: true, questions: test.questions });
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },

  userSubmitTest: async (req, res) => {
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
  },
};

module.exports = userDashboardController;
