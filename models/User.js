const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: { type: Number, required: true },
  // department: { type: String, required: true },
  // faculty: { type: String, required: true },
  // level: { type: Number, required: true },
  // hostel: { type: String, required: true },
  userNumber: { type: Number, required: true, unique: true },
  avatarUrl: { type: String },
  points: {type:Number, default:0},
  badges:{type:[String],default:[]},
  streak:{type:Number,default:0}
});

module.exports = mongoose.model("User", userSchema);
