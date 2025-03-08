const mongoose = require("mongoose")
const PostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  category: { type: String, required: true },
  tags: [{ type: String }],
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }]
}, {
  timestamps: true
})

module.exports = mongoose.model("Post", PostSchema);