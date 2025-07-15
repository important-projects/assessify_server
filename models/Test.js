const mongoose = require('mongoose')
const testSchema = new mongoose.Schema({
  // Edit: userId was initially commented for unknown reasons, uncommented it.
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Courses', required: true
  },
  answers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Answer', required: true }],
  totalScore: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['new', 'completed'],
    required: true
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
})

module.exports = mongoose.model('Test', testSchema)
