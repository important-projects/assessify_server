const mongoose = require('mongoose')

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  answer: { type: String, required: true },
  correctAnswer: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
  score: { type: Number, required: true }
})

const testSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: String, required: true },
  answers: [answerSchema],
  totalScore: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['new', 'completed'],
    required: true
  },
})

module.exports = mongoose.model('Test', testSchema)
