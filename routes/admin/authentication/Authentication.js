const express = require('express')
const router = express.Router()
const Admin = require("../../../models/Admin")
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

require("dotenv").config()

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

// Admin User registration
router.post('/register', async (req, res) => {
    const { email, password, username } = req.body

    if (!email || !password || !username) {
        console.log('All fields are required')
        return res.status(400).json({ message: 'All fields are required' })
    }

    try {
        const adminNumber = Math.floor(100000 + Math.random() * 900000)

        const existingUserByEmail = await Admin.findOne({ email })
        if (existingUserByEmail) {
            console.log('Email is already in use')
            return res.status(400).json({ message: 'Email used' })
        }

        const existingUserByUsername = await User.findOne({ username })
        if (existingUserByUsername) {
            console.log('Username already used')
            return res.status(400).json({ message: 'Username already used' })
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create new user
        const user = new Admin({
            username,
            email,
            password: hashedPassword,
            adminNumber: adminNumber
        })
        await user.save()


        // Generate JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '1h'
        })

        // const userDetails = {
        //   id: user._id,
        //   email: user.email,
        //   adminNumber: user.adminNumber
        // }

        console.log('Admin registered successfully:', { user, token })
        res.status(201).json({
            message: 'User registered successfully.',
            user,
            token
        })
    } catch (error) {
        console.error('Registration error:', error)
        res.status(500).json({ message: 'Error registering user', error })
    }
})

// Admin User login
router.post('/login', async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        console.log('Email and password are required')
        return res
            .status(400)
            .json({ message: 'Email and password are required' })
    }

    try {
        const user = await Admin.findOne({ email }).select('+password')
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




module.exports = { router, isAdmin }
