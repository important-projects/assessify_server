const fs = require("fs");
const Question = require("../models/question");
const Test = require("../models/test");
const Course = require("../models/courses");
const { extractQuestionsFromPdf } = require("../utils/mediaUpload");

const adminDashboardController = {
  createTest: async (req, res) => {
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
      if (file) fs.unlinkSync(file.path);
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(course)) {
      if (file) fs.unlinkSync(file.path);
      return res
        .status(400)
        .json({ success: false, message: "Invalid course ID" });
    }

    // Check if course exists
    try {
      const courseExists = await Course.exists({ _id: course });
      if (!courseExists) {
        if (file) fs.unlinkSync(file.path);
        return res
          .status(404)
          .json({ success: true, message: "Course not found" });
      }
    } catch (err) {
      if (file) fs.unlinkSync(file.path);
      return res.status(500).json({
        success: false,
        message: "Error checking course",
        error: err.message,
      });
    }

    let savedQuestions = [];

    try {
      // Handle file upload case
      if (file) {
        // File type validation is already handled by multer filter
        const extractedQuestions = await extractQuestionsFromPdf(
          file.path,
          course
        );

        if (!extractedQuestions.length) {
          fs.unlinkSync(file.path);
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
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return res.status(201).json({
        success: true,
        message: "Test created successfully",
        testId: newTest._id,
        questionCount: savedQuestions.length,
      });
    } catch (err) {
      console.error("Test creation error:", err);

      // Clean up any uploaded file in case of error
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: err.message,
      });
    }
  },

  getTestResult: async (req, res) => {
    try {
      const results = await Test.find({ userId: { $ne: null } }).populate(
        "userId",
        "username email"
      );
      res.status(200).json({ success: true, results });
    } catch (err) {
      console.error("Error fetching results:", err);
      res.status(500).json({
        success: false,
        message: "Error retrieving scores",
        error: err.message,
      });
    }
  },

  getTopScores: async (req, res) => {
    try {
      const scores = await Test.find()
        .sort({ totalScore: -1 })
        .limit(10)
        .populate("userId", "username email");
      res.status(200).json({ success: true, scores });
    } catch (err) {
      console.error("Error fetching top scores:", err);
      res.status(500).json({
        success: false,
        message: "Error retrieving top scores",
        error: err.message,
      });
    }
  },

  listAvailableCourses: async (req, res) => {
    try {
      const userCourses = await Course.find();
      if (!userCourses || userCourses.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "No courses found" });
      }

      const courseCount = userCourses.length;
      console.log("Total courses found:", courseCount, userCourses);
      res
        .status(200)
        .json({ success: true, courses: userCourses, count: courseCount });
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  createCourse: async (req, res) => {
    try {
      const { name, description } = req.body;
      const userId = req.user?.id;

      if (!name || !description) {
        return res
          .status(400)
          .json({ success: false, message: "Incomplete request" });
      }

      if (!userId) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid request" });
      }

      const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const existingCourse = await Course.findOne({
        name: { $regex: new RegExp(`^${escapedName}$`, "i") },
      });

      if (existingCourse) {
        return res.status(409).json({
          success: false,
          message: "A course with this name already exists",
        });
      }

      const newCourse = new Course({
        name,
        description,
        createdBy: req.user?.id,
      });
      await newCourse.save();

      return res.status(201).json({
        success: true,
        message: "Course created successfully",
        course: newCourse,
      });
    } catch (error) {
      console.error("Error creating new course:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error", error });
    }
  },

  getPieData: async (req, res) => {
    try {
      const aggregated = await Test.aggregate([
        { $unwind: "$answers" },
        { $group: { _id: "$answers.category", count: { $sum: 1 } } },
      ]);

      const labels = aggregated.map((item) => item._id);
      const values = aggregated.map((item) => item.count);

      res.status(200).json({ success: true, labels, values });
    } catch (err) {
      console.error("Error fetching pie data:", err);
      res.status(500).json({
        success: false,
        message: "Error retrieving pie chart data",
        error: err.message,
      });
    }
  },

  getLeaderboardData: async (req, res) => {
    try {
      const leaderboard = await Test.aggregate([
        {
          $group: {
            _id: "$userId",
            totalScore: { $sum: "$totalScore" },
            testCount: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        { $unwind: "$userDetails" },
        { $sort: { totalScore: -1 } },
        { $limit: 10 },
        {
          $project: {
            _id: 1,
            totalScore: 1,
            testCount: 1,
            "userDetails.username": 1,
            "userDetails.email": 1,
          },
        },
      ]);

      res.status(200).json({ success: true, leaderboard });
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      res.status(500).json({
        success: false,
        message: "Error retrieving leaderboard",
        error: err.message,
      });
    }
  },
};

module.exports = adminDashboardController;
