const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Admin = require("../models/Admin")

const dotenv = require("dotenv");
dotenv.config();

// User registration
router.post("/register", async (req, res) => {
  const { username, email, password, age, userNumber } = req.body;

  if (!username || !email || !password || !age || !userNumber) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check for an existing email
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return res.status(400).json({ message: "Email is already taken." });
    }

    // Check for an existing username
    const existingUserByUsername = await User.findOne({ username });
    if (existingUserByUsername) {
      return res.status(400).json({ message: "Username is already taken." });
    }

    // Check for an existing user number
    const existingUserByNumber = await User.findOne({ userNumber });
    if (existingUserByNumber) {
      {
        return res
          .status(400)
          .json({ message: "User number is already taken." });
      }
    }

    // Password saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      username,
      email,
      password,
      age,
      userNumber,
    });
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const userDetails = {
      id: user._id,
      username: user.username,
      email: user.email,
      age: user.age,
      userNumber: user.userNumber,
    };

    res.status(201).json({
      message: "User registered successfully.",
      user: userDetails,
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Error registering user", error });
  }
});

// User login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    // Find user bt email
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ message: "Invalid email" });
    }

    // Compare password
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    });

    const userDetails = {
      id: user._id,
      username: user.username,
      email: user.email,
      age: user.age,
      userNumber: user.userNumber,
    };

    return res
      .status(201)
      .json({ message: "Login successful.", user: userDetails, token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Login error.", error });
  }
});

// Middleware to authenticate user JWT token
const protect = async (req, res, next) => {
  console.log("Authorization Header:", req.headers.authorization);

  if (!req.headers.authorization) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access banned." });
  }
  // const user = await User.findById(req.user.id);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log("Decoded user:", req.user);
    next();
  } catch (error) {
    console.error("JWT verification failed:", error);
    return res.status(401).json({ message: "Not authorized." });
  }
};

// Middleware to check if the user is an admin

const isAdmin = async (req, res, next) => {
  try {
    console.log("Decoded user ID:", req.user.id); // Log the user ID from JWT
    if (!req.user || !req.user.id) {
      return res
        .status(401)
        .json({ message: "Unauthorized. Admin information is missing." });
    }
    const admin = await Admin.findById(req.user.id);

    if (!admin) {
      console.log("Admin not found");
      return res
        .status(403)
        .json({ message: "Access forbidden. Admins only." });
    }

    console.log("Admin found:", admin); // Log the admin details
    next();
  } catch (error) {
    console.error("Error checking admin status:", error.message); // Log the error for debugging
    return res
      .status(500)
      .json({ message: "Error checking admin status", error: error.message });
  }
};

module.exports = { router, protect, isAdmin };
