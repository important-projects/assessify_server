const express = require('express')
const http = require('http')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const mongoose = require('mongoose')
const { router: AuthRoutes } = require('./routes/Authentication')
// const TestRoutes = require("./routes/Test");
const UserDashboardRoutes = require('./routes/UserDashboard')
const FetchUserRoutes = require('./routes/FetchUser')
const ForumRoutes = require('./routes/Forum')
const EmailRoute = require('./routes/Mailer')
const AdminRoute = require('./routes/Admin')
const dotenv = require('dotenv')

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
      // "http://localhost:5173",
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
app.use('/details', FetchUserRoutes)
app.use('/forum', ForumRoutes)
app.use('/assessify', EmailRoute)
app.use('/admin', AdminRoute)

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
