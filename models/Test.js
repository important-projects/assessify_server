const mongoose = require('mongoose')

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  answer: { type: String, default: '' },
  correctAnswer: { type: String, required: true },
  isCorrect: { type: Boolean, default: false },
  score: { type: Number, default: 0 }
})

const testSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  testName: { type: String, required: true },
  category: { type: String, required: true },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'ongoing', 'completed', 'active'],
    default: 'active'
  },
  duration: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  totalScore: { type: Number, default: 0 },
  answers: [answerSchema],
  totalObjectiveScore: { type: Number, default: 0 },
  totalSubjectiveScore: { type: Number, default: 0 },
  subjectivePending: { type: Boolean, default: false },
  totalQuestionsAttempted: { type: Number, default: 0 },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }]
})

module.exports = mongoose.model('Test', testSchema)
