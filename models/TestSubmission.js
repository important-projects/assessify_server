const mongoose = require("mongoose")

const TestSubmissionSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  test: {
    type: Schema.Types.ObjectId,
    ref: 'Test'
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course'
  },
  responses: [
    {
      question: {
        type: Schema.Types.ObjectId,
        ref: 'Question'
      },
      answer: String
    }
  ],
  score: Number,
  submittedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'graded'],
    default: 'pending'
  }
});
module.exports = mongoose.model('TestSubmission', TestSubmissionSchema)
