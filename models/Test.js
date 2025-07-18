const mongoose = require('mongoose')
const testSchema = new mongoose.Schema({
  // Edit: userId was initially commented for unknown reasons, uncommented it.
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course', required: true
  },
  answers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Answer', required: true }],
  totalScore: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  testName: { type: String, required: true },
  courseCode: { type: String, required: true },
  level: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  duration: { type: Number, required: true },
  status: {
    type: String,
    enum: ['new', 'completed','ongoing'],
    required: true
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
})

module.exports = mongoose.model('Test', testSchema)
