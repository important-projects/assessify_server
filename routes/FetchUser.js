const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect } = require("./Authentication");

router.get("/fetchuser/:id", protect, async (req, res) => {
  console.log("Fetched user id:", req.params.id);

  try {
    const user = await User.findById(req.params.id);
    console.log("User found: ", user);
    res.json(user);
  } catch (error) {
    console.error("Error fetchin user: ", error);
    res.status(500).json({
      message: "Error fetcing user:",
      error,
    });
  }
});

module.exports = router;