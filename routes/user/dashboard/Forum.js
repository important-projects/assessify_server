const express = require("express");
const router = express.Router();
const Post = require("../../../models/Post")
const Comment = require("../../../models/Comment")
const { protect } = require("../authentication/Authentication")


// Create new post
router.post("/create", protect, async (req, res) => {
  try {
    const { title, content, category, tags } = req.body
    const post = new Post({ title, content, category, tags, user: req.user.id });

    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: "Error creating post", error })
  }
});

// Omooooooooooooooooooooo......was just testing how the fuck I pushed the .env file into the repo
// sight
// Get all posts
router.get("/posts", async (req, res) => {
  try {
    const posts = await Post.find().populate("user", "username").sort({ createdAt: -1 })
    res.status(200).json(posts)
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts", error })
  }
})

router.get("/post/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("user", "username")
      .populate({
        path: "comments",
        populate: { path: "user", select: "username" },
      });
    if (!post) return res.status(404).json({ message: "Post not found" });

    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: "Error fetching post", error });
  }
});

// Add a comment to a post
router.post("/comment/:postId", protect, async (req, res) => {
  const { content } = req.body;
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = new Comment({
      postId: req.params.postId,
      user: req.user.id,
      content,
    });

    await comment.save();
    post.comments.push(comment._id);
    await post.save();

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: "Error adding comment", error });
  }
});

// Upvote a post
router.post("/upvote/:postId", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.upvotes += 1;
    await post.save();

    res.status(200).json({ message: "Post upvoted successfully", upvotes: post.upvotes });
  } catch (error) {
    res.status(500).json({ message: "Error upvoting post", error });
  }
});

// Downvote a post
router.post("/downvote/:postId", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Edit: was initially post.downvotes += 1; changed + to -
    post.downvotes -= 1;
    await post.save();

    res.status(200).json({ message: "Post downvoted successfully", downvotes: post.downvotes });
  } catch (error) {
    res.status(500).json({ message: "Error downvoting post", error });
  }
});

// Delete a post (Admin or post owner)
router.delete("/delete/:id", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await post.deleteOne();
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting post", error });
  }
});

module.exports = router;