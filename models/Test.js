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
  testName: { type: String, required: true },
  category: { type: String, required: true },
  status: {
    type: String,
    required: true,
    enum: ['active', 'completed'],
    default: 'active'
  },
  duration: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  totalScore: { type: Number, default: 0 },
  answers: [
    {
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: true
      },
      answer: { type: String, default: '' },
      correctAnswer: { type: String, required: true },
      isCorrect: { type: Boolean, default: false },
      score: { type: Number, default: 0 }
    }
  ]
})

module.exports = mongoose.model('Test', testSchema)
