const mongoose = require('mongoose')

// Define the Answer schema as a subdocument within the Test schema
const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  answer: { type: String, required: true }, // User's answer
  correctAnswer: { type: String, required: true }, // Correct answer
  isCorrect: { type: Boolean, required: true }, // Whether the answer is correct
  score: { type: Number, required: true } // Points for this answer
})

const testSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // testName: { type: String, required: true }, // Test name created by the admin
  course: { type: String, required: true }, // Test category (e.g., "React.js")
  answers: [answerSchema], // List of answers for this test
  totalScore: { type: Number, required: true }, // Total score for the test
  createdAt: { type: Date, default: Date.now } // Date of test submission
  // submittedAt: { type: Date, default: Date.now }, // Date of test submission
})

module.exports = mongoose.model('Test', testSchema)
