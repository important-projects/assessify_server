const express = require('express')
const { google } = require('googleapis')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../../../models/User')
const Admin = require('../../../models/Admin')
const Course = require("../../../models/Courses")
require('dotenv').config()

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
      userNumber: userNumber,
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

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_OAUTH_CLIENT,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  process.env.GOOGLE_OAUTH_REDIRECT_URL
)

router.get('/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email']
  })
  res.redirect(url)
})

router.get('/google/callback', async (req, res) => {
  const code = req.query.code

  try {
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2',
    })

    const { data } = await oauth2.userinfo.get()

    const googleEmail = data.email
    const googleName = data.name || data.email.split('@')[0]
    const avatarUrl = data.picture

    let user = await User.findOne({ email: googleEmail })

    if (!user) {
      let userNumber
      let isUnique = false
      while (!isUnique) {
        userNumber = Math.floor(100000 + Math.random() * 900000)
        const existingUser = await User.findOne({ userNumber })
        if (!existingUser) {
          isUnique = true
        }
      }

      user = new User({
        username: googleName,
        email: googleEmail,
        password: await bcrypt.hash(Math.random().toString(36).slice(2), 10),
        userNumber,
        registeredCourses: [],
        avatarUrl,
        authProvider: 'google'
      })
      await user.save()
    } else {
      user.username = user.username || googleName
      user.avatarUrl = user.avatarUrl || avatarUrl
      user.authProvider = user.authProvider || 'google'
      await user.save()
    }

    const tokenPayload = {
      id: user._id,
      username: user.username,
      email: user.email,
      registeredCourses: user.registeredCourses
    }

    console.log(data)
    console.log(tokenPayload)

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1h' })
    const encodedUser = encodeURIComponent(JSON.stringify(tokenPayload))

    res.redirect(`${process.env.ALLOWED_ORIGINS}/auth/google/callback?token=${token}&user=${encodedUser}`)
  } catch (error) {
    console.error('Error during Google auhentication:', error.message)
    res.status(500).json({ error: 'Authentication failed', details: error.message });
  }
})

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


module.exports = { router, protect }
