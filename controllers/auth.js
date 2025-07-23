const bcrypt = require("bcryptjs")
const { google } = require('googleapis')
const jwt = require('jsonwebtoken')

const User = require("../models/user")
const Admin = require("../models/admin")
const Course = require("../models/courses")

require("dotenv").config()

// OAuth Client
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    process.env.GOOGLE_OAUTH_REDIRECT_URL
)

const authController = {
    // Admin Registration
    adminRegistration: async (req, res) => {
        const { username, email, password } = req.body
        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" })
        }

        try {
            const adminNumber = Math.floor(100000 + Math.random() * 900000)
            const existingUserByEmail = await Admin.findOne({ email })
            if (existingUserByEmail) {
                console.log('Email is already in use')
                return res.status(400).json({ message: 'Email used' })
            }
            const existingUserByUsername = await Admin.findOne({ username })
            if (existingUserByUsername) {
                console.log('Username already used')
                return res.status(400).json({ message: 'Username already used' })
            }

            await Admin.create({
                username,
                email,
                password: await bcrypt.hash(password, 10),
                adminNumber
            })
            console.log('Admin registered successfully')
            return res.status(201).json({
                success: true,
                message: 'Admin registered successfully', admin: {
                    username,
                    email,
                }
            })
        }
        catch (error) {
            console.error('Error checking existing admin:', error)
            return res.status(500).json({ success: false, message: 'Server error while checking existing admin' })
        }
    },

    adminLogin: async (req, res) => {
        const { email, password } = req.body

        if (!email || !password) {
            console.log('Email and password are required')
            return res.status(400).json({ message: 'Email and password are required' })
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
                return res.status(400).json({ success: true, message: 'Invalid password' })
            }

            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRES_IN
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
                success: true,
                message: 'Login successful.',
                user: userDetails,
                token
            })
        } catch (error) {
            console.error('Login error:', error)
            return res.status(500).json({ success: false, message: 'Login error.', error })
        }
    },

    userRegistration: async (req, res) => {
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
                return res.status(404).json({ success: false, message: 'One or more invalid courses selected' });
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
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

            // Send response
            console.log('User registered successfully:', { user, token });
            res.status(201).json({ success: true, message: 'User registered successfully', user, token });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ success: false, message: 'Error registering user', error });
        }
    },

    userLogin: async (req, res) => {
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
                expiresIn: process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRES_IN
            })

            const userDetails = {
                id: user._id,
                username: user.username,
                email: user.email,
                age: user.age,
                userNumber: user.userNumber,
                registeredCourses: user.registeredCourses,
                subscription: user.subscription
            }

            console.log('Login successful:', { user: userDetails, token })
            return res.status(200).json({
                success: true,
                message: 'Login successful.',
                user: userDetails,
                token
            })
        } catch (error) {
            console.error('Login error:', error)
            return res.status(500).json({ success: false, message: 'Login error.', error })
        }
    },

    userVerification: async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    authenticated: false,
                    message: 'Not authenticated'
                });
            }

            res.json({
                success: true,
                authenticated: true,
                user: {
                    id: req.user.id,
                    username: req.user.username,
                    email: req.user.email,
                    avatarUrl: req.user.avatarUrl,
                    role: req.user.role,
                    subscription: req.user.subscription
                },
                token: req.cookies.token
            });
        } catch (error) {
            console.error('Error fetching user:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    OAuthClient: (req, res) => {
        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: ['profile', 'email']
        })
        res.redirect(url)
    },
    OAuthCallback: async (req, res) => {
        const code = req.query.code;

        try {
            const { tokens } = await oauth2Client.getToken(code);
            oauth2Client.setCredentials(tokens);

            const { data } = await google.oauth2('v2').userinfo.get({ auth: oauth2Client });

            const googleEmail = data.email;
            const googleName = (data.name || data.email.split('@')[0]).replace(/\W+/g, '_'); // Sanitize username
            const avatarUrl = data.picture;

            let user = await User.findOne({ email: googleEmail });

            if (!user) {
                let userNumber;
                let isUnique = false;
                while (!isUnique) {
                    userNumber = Math.floor(100000 + Math.random() * 900000);
                    const existingUser = await User.findOne({ userNumber });
                    if (!existingUser) {
                        isUnique = true;
                    }
                }

                user = new User({
                    username: googleName,
                    email: googleEmail,
                    password: await bcrypt.hash(Math.random().toString(36).slice(2), 10),
                    userNumber,
                    avatarUrl,
                    authProvider: 'google',
                    subscription: { status: 'inactive' },
                    registeredCourses: [],
                    status: 'active'
                });
                await user.save();
            } else {
                // Update existing user if needed
                const updates = {};
                if (!user.username) updates.username = googleName;
                if (!user.avatarUrl) updates.avatarUrl = avatarUrl;
                if (!user.authProvider) updates.authProvider = 'google';

                if (Object.keys(updates).length > 0) {
                    await User.updateOne({ _id: user._id }, updates);
                }
            }

            // Create clean token payload without sensitive data
            const tokenPayload = {
                id: user._id,
                username: user.username,
                email: user.email,
                avatarUrl: user.avatarUrl,
                subscription: user.subscription,
                role: user.role,
                status: user.status,
            };

            const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
            console.log(token)

            // Set the cookie
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'none',
                maxAge: 3600000
            });

            // Redirect to frontend with user data in URL (not recommended for sensitive data)
            const userData = encodeURIComponent(JSON.stringify({
                id: user._id,
                username: user.username,
                email: user.email,
                avatarUrl: user.avatarUrl,
                subscription: user.subscription,
                role: user.role,
                status: user.status,
            }));
            console.log(userData)

            res.redirect(`${process.env.ALLOWED_ORIGINS}/auth/success?token=${token}`);
        } catch (error) {
            console.error('Error during Google authentication:', error);
            res.redirect(`${process.env.ALLOWED_ORIGINS}/auth/error?message=${encodeURIComponent('Authentication failed')}`);
        }
    }

    , courseRegistration: async (req, res) => {
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

            res.status(200).json({ success: true, message: 'Courses registered successfully', courses: user.registeredCourses });
        } catch (error) {
            console.error('Error registering courses:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

module.exports = authController