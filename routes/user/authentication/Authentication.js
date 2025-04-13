const express = require('express')
const mongoose = require("mongoose")
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../../../models/User')
const Admin = require('../../../models/Admin')
const Course = require("../../../models/Courses")
// const Course = require('../models/Courses')

const dotenv = require('dotenv')
dotenv.config()

// Middleware to authenticate user JWT token
const protect = async (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]

  if (!token) {
    console.log('Access banned due to missing token')
    return res.status(401).json({ message: 'Access banned.' })
  }
  if (!req.headers.authorization) {
    console.log('No token provided')
    return res
      .status(401)
      .json({ message: 'Access denied. No token provided.' })
  }
  console.log('Authorization Header:', req.headers.authorization)

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    console.log('Decoded user:', req.user)
    next()
  } catch (error) {
    console.error('JWT verification failed:', error)
    return res.status(403).json({ message: 'Invalid Token!.' })
  }
}

// User registration
router.post('/register', async (req, res) => {
  const { username, email, password, courses } = req.body;

  if (!username || !email || !password || !courses || !Array.isArray(courses)) {
    console.log('All fields are required, and courses must be an array');
    return res.status(400).json({ message: 'All fields are required, and courses must be an array' });
  }

  try {
    const userNumber = Math.floor(100000 + Math.random() * 900000)
    // Validate courses: Check if all provided courses exist
    const courseIds = courses.map(course => course._id);
    const validCourses = await Course.find({ _id: { $in: courseIds } });

    if (validCourses.length !== courseIds.length) {
      console.log('One or more invalid courses selected');
      return res.status(404).json({ message: 'One or more invalid courses selected' });
    }

    // Check for existing user
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) return res.status(400).json({ message: 'Email already used' });

    const existingUserByUsername = await User.findOne({ username });
    if (existingUserByUsername) return res.status(400).json({ message: 'Username already used' });

    const existingUserByNumber = await User.findOne({ userNumber });
    if (existingUserByNumber) return res.status(400).json({ message: 'User number already used' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);


    // Create user with full course details
    const user = new User({
      username,
      email,
      password: hashedPassword,
      userNumber:userNumber,
      registeredCourses: validCourses.map(course => ({
        _id: course._id,
        name: course.name,
        description: course.description,
      })),
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Send response
    console.log('User registered successfully:', { user, token });
    res.status(201).json({ message: 'User registered successfully', user, token });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user', error });
  }
});


router.post('/courses/register', protect, async (req, res) => {
  const { courseIds } = req.body
  const userId = req.user.id

  if (!courseIds || !Array.isArray(courseIds)) {
    console.log('Invalid course IDs')
    return res.status(400).json({ message: 'Course IDs must be an array' })
  }

  try {
    // Validate courses
    const validCourses = await Course.find({ _id: { $in: courseIds } });
    if (validCourses.length !== courseIds.length) {
      return res.status(404).json({ message: 'One or more courses not found' });
    }

    // Update user’s registeredCourses
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add new courses, avoiding duplicates
    const newCourses = validCourses.map((course) => ({
      _id: course._id,
      name: course.name,
      description: course.description,
    }));
    user.registeredCourses = [
      ...user.registeredCourses.filter(
        (c) => !newCourses.some((nc) => nc._id.toString() === c._id.toString())
      ),
      ...newCourses,
    ];
    await user.save();

    // Update course’s registeredUsers
    await Course.updateMany(
      { _id: { $in: courseIds } },
      { $addToSet: { registeredUsers: userId } }
    );

    res.status(200).json({ message: 'Courses registered successfully', courses: user.registeredCourses });
  } catch (error) {
    console.error('Error registering courses:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// User login
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    console.log('Email and password are required')
    return res.status(400).json({ message: 'Email and password are required' })
  }

  try {
    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      console.log('Invalid email')
      return res.status(400).json({ message: 'Invalid email' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      console.log('Invalid password')
      return res.status(400).json({ message: 'Invalid password' })
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    })

    const userDetails = {
      id: user._id,
      username: user.username,
      email: user.email,
      age: user.age,
      userNumber: user.userNumber,
      registeredCourses: user.registeredCourses
    }

    console.log('Login successful:', { user: userDetails, token })
    return res.status(200).json({
      message: 'Login successful.',
      user: userDetails,
      token
    })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ message: 'Login error.', error })
  }
})

// User registration
router.post('/admin/register', async (req, res) => {
  const { email, password, adminNumber } = req.body

  if (!email || !password || !adminNumber) {
    console.log('All fields are required')
    return res.status(400).json({ message: 'All fields are required' })
  }

  try {
    const existingUserByEmail = await Admin.findOne({ email })
    if (existingUserByEmail) {
      console.log('Email is already in use')
      return res.status(400).json({ message: 'Email used' })
    }

    const existingUserByNumber = await Admin.findOne({ adminNumber })
    if (existingUserByNumber) {
      console.log('User number is already in use')
      return res.status(400).json({ message: 'User number used' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new user
    const user = new Admin({
      email,
      password: hashedPassword, // Use hashed password
      adminNumber
    })
    await user.save()

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    })

    const userDetails = {
      id: user._id,
      email: user.email,
      adminNumber: user.adminNumber
    }

    console.log('Admin registered successfully:', { user: userDetails, token })
    res.status(201).json({
      message: 'User registered successfully.',
      user: userDetails,
      token
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ message: 'Error registering user', error })
  }
})

// User login
router.post('/admin/login', async (req, res) => {
  const { adminNumber, password } = req.body

  if (!adminNumber || !password) {
    console.log('Admin number and password are required')
    return res
      .status(400)
      .json({ message: 'Admin number and password are required' })
  }

  try {
    const user = await Admin.findOne({ adminNumber }).select('+password')
    if (!user) {
      console.log('Invalid admin number')
      return res.status(400).json({ message: 'Invalid admin number' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      console.log('Invalid password')
      return res.status(400).json({ message: 'Invalid password' })
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    })

    const userDetails = {
      id: user._id,
      email: user.email,
      userNumber: user.userNumber
    }

    console.log('Login successful:', { user: userDetails, token })
    return res.status(200).json({
      message: 'Login successful.',
      user: userDetails,
      token
    })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ message: 'Login error.', error })
  }
})

// Middleware to check if the user is an admin
const isAdmin = async (req, res, next) => {
  try {
    console.log('Checking admin access for user ID:', req.user?.id)

    if (!req.user || !req.user.id) {
      console.log('Unauthorized access attempt - No admin information found')
      return res
        .status(401)
        .json({ message: 'Unauthorized. Admin information is missing.' })
    }

    const admin = await Admin.findById(req.user.id)

    if (!admin) {
      console.log('Admin not found - Access forbidden')
      return res.status(403).json({ message: 'Access forbidden. Admins only.' })
    }

    console.log('Admin verified:', admin)
    next()
  } catch (error) {
    console.error('Error checking admin status:', error.message)
    return res
      .status(500)
      .json({ message: 'Error checking admin status', error: error.message })
  }
}

module.exports = { router, protect, isAdmin }
