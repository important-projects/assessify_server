const mongoose = require('mongoose')

const responseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  answer: { type: String, required: true },
  isCorrect: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  pointsEarned: {
    type: Number,
    default: 0
  },
  maxPoints: {
    type: Number,
    required: true
  },
  feedback: {
    type: String
  },
  conceptsAddressed: {
    type: [String],
    default: []
  },
  improvementAreas: {
    type: [String],
    default: []
  },
  questionType: {
    type: String,
    enum: ['multiple-choice', 'theory', 'objective', 'subjective', 'short-answer', 'fill-in-the-blank'],
    required: true
  },
  gradedWithAI: {
    type: Boolean,
    default: false
  },
  // automatedGrading: {
  //   type: Boolean,
  //   default: true
  // }
}, {
  timestamps: true
});

module.exports = mongoose.model('Response', responseSchema);
