const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    userNumber: { type: Number, required: true, unique: true },
    avatarUrl: { type: String },
    authProvider: { type: String, enum: ['manual', 'google'], default: 'manual' },
    registeredCourses: [{ _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }, name: String, description: String }],
    testSubmissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TestSubmission'
      }
    ]

  },
  { timestamps: true }
)


module.exports = mongoose.model('User', userSchema)

// userSchema.pre('save', async function (next) {
//   if (!this.isModified('password')) return next()
//   const salt = await bcrypt.genSalt(10)
//   this.password = await bcrypt.hash(this.password, salt)
//   next()
// })
// const bcrypt = require('bcryptjs')
// department: { type: String, required: true },
// faculty: { type: String, required: true },
// level: { type: Number, required: true },
// hostel: { type: String, required: true },
// courseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Courses' }]
// points: { type: Number, default: 0 },
// badges: { type: [String], default: [] },
// streak: { type: Number, default: 0 },
// courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Courses' }
// courseEnrolled: { type: String },