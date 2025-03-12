const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: { type: Number, required: true },
  userNumber: { type: Number, required: true, unique: true },
  avatarUrl: { type: String },
  points: { type: Number, default: 0 },
  badges: { type: [String], default: [] },
  streak: { type: Number, default: 0 }
})

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

module.exports = mongoose.model('User', userSchema)

// department: { type: String, required: true },
// faculty: { type: String, required: true },
// level: { type: Number, required: true },
// hostel: { type: String, required: true },
