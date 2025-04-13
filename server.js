const express = require('express')
const http = require('http')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const jwt = require("jsonwebtoken")
const mongoose = require('mongoose')
const { router: AuthRoutes } = require('./routes/user/authentication/Authentication')
const TestRoutes = require("./routes/user/dashboard/Test");
const UserDashboardRoutes = require('./routes/user/dashboard/UserDashboard')
const FetchUserRoutes = require('./routes/user/dashboard/FetchUser')
const ForumRoutes = require('./routes/user/dashboard/Forum')
const EmailRoute = require('./routes/mailer/Mailer')
const AdminRoute = require('./routes/admin/Admin')
const User = require('./models/User')
const dotenv = require('dotenv')
const bcrypt = require('bcryptjs')
const { google } = require("googleapis")

const PORT = process.env.PORT || 5000
const server = http.createServer(app)

mongoose.set('strictPopulate', false)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// cors config
dotenv.config()
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      "http://localhost:5173",
      'https://assessify-ten.vercel.app',
      '*'
      // "https://assessify-server.onrender.com"
    ],
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true
  })
)
app.use(express.json())

mongoose
  .connect(process.env.DB_URI, {
    serverSelectionTimeoutMS: 100000
  })
  .then(() => {
    console.log('MongoDB connected')

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err)
    process.exit(1)
  })

app.use('/auth', AuthRoutes)
// app.use("/test", TestRoutes);
app.use('/dashboard/user', UserDashboardRoutes)
app.use('/dashboard/test', TestRoutes)
app.use('/details', FetchUserRoutes)
app.use('/forum', ForumRoutes)
app.use('/assessify', EmailRoute)
app.use('/admin', AdminRoute)

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_OAUTH_CLIENT,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  process.env.GOOGLE_OAUTH_REDIRECT_URL
)

app.get('/auth/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email'],
  });
  res.redirect(url)
})

app.get('/auth/google/callback', async (req, res) => {
  const code = req.query.code

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

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
      let userNumber;
      let isUnique = false;
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
        age: 18,
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
      userNumber: user.userNumber,
      registeredCourses: user.registeredCourses
    }
    // const user = {
    //   username: data.name,
    //   email: data.email,
    //   avatarUrl: data.picture
    // }

    console.log(data)
    console.log(tokenPayload)

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "1d" })
    const encodedUser = encodeURIComponent(JSON.stringify(tokenPayload))

    // res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    // res.redirect('http://localhost:5173/auth/google/callback');
    res.redirect(`http://localhost:5173/auth/google/callback?token=${token}&user=${encodedUser}`)
  }
  catch (error) {
    console.error('Error during Google authentication:', error.message);
    res.status(500).json({ error: 'Authentication failed', details: error.message });
  }
})

app.get('/current-datetime', (req, res) => {
  try {
    const utcDate = new Date()
    const watDate = new Date(utcDate.getTime() + 1 * 60 * 60 * 1000)

    const getOrdinalSuffix = day => {
      if (day > 3 && day < 21) return 'th'
      const suffixes = ['th', 'st', 'nd', 'rd']
      return suffixes[day % 10 > 3 ? 0 : day % 10]
    }

    const day = watDate.getDate()
    const month = watDate.toLocaleString('en-US', { month: 'long' })
    const year = watDate.getFullYear()

    const formattedDate = `${day}${getOrdinalSuffix(day)} ${month}, ${year}`

    console.log('Fetched date data:', formattedDate)
    res.json({ formattedDate })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Couldn't fetch date" })
  }
})

app.get('/', (req, res) => {
  console.log('Server running')
  res.status(200).json({ message: `Server running on ${PORT}` })
})