const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    required: true,
  },
  answer: { type: String, required: true },
  correctAnswer: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
  score: { type: Number, required: true },
});

const testSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  // testName: { type: String, required: true }, // Test name created by the admin
  category: { type: String, required: true }, // Test category (e.g., "React.js")
  answers: [answerSchema], // List of answers for this test
  totalScore: { type: Number, required: true }, // Total score for the test
  createdAt: { type: Date, default: Date.now }, // Date of test submission
  // submittedAt: { type: Date, default: Date.now }, // Date of test submission
});

module.exports = mongoose.model("Test", testSchema);
