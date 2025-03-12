// const mongoose = require('mongoose')
// const User = require('./models/User')
// const Question = require('./models/Question')
// const Test = require('./models/Test')
// const bcrypt = require('bcryptjs')
// require('dotenv').config()

// mongoose
//   .connect(process.env.DB_URI)
//   .then(() => console.log('MongoDB connected!'))
//   .catch(err => console.log('MongoDB connection failed', err))

// const seedDatabase = async () => {
//   try {
//     // Clear existing data
//     await User.deleteMany({})
//     await Question.deleteMany({})
//     await Test.deleteMany({})

//     // Create User
//     const userId = new mongoose.Types.ObjectId()
//     const hashedPassword = await bcrypt.hash('testpassword', 10)

//     const user = await User.create({
//       _id: userId,
//       username: 'Emmanuel',
//       email: 'faramadetoluwanimi1@gmail.com',
//       password: hashedPassword,
//       age: 20,
//       userNumber: 236737,
//       points: 0,
//       badges: [],
//       streak: 0
//     })

//     console.log('User created:', user)

//     // Create Questions
//     const questions = await Question.insertMany([
//       {
//         _id: new mongoose.Types.ObjectId(),
//         category: 'Geography',
//         questionText: 'What is the capital of France?',
//         options: ['Berlin', 'Madrid', 'Paris', 'Rome'],
//         correctAnswer: 'Paris',
//         questionType: 'objective'
//       },
//       {
//         _id: new mongoose.Types.ObjectId(),
//         category: 'Programming',
//         questionText: 'Explain the concept of Object-Oriented Programming.',
//         correctAnswer: null, // Subjective question
//         questionType: 'subjective'
//       }
//     ])

//     console.log('Questions added:', questions)

//     // Create Active Test
//     const activeTest = await Test.create({
//       _id: new mongoose.Types.ObjectId(),
//       userId: user._id,
//       testName: 'General Knowledge Test',
//       category: 'General Knowledge',
//       status: 'active',
//       duration: 30,
//       dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Set due date to tomorrow
//       createdAt: new Date(),
//       answers: questions.map(q => ({
//         questionId: q._id,
//         answer: q.questionType === 'objective' ? '' : 'Subjective Answer', // Set to empty string or placeholder
//         correctAnswer: q.correctAnswer || 'No correct answer provided', // Ensure correctAnswer is always defined
//         isCorrect: q.questionType === 'objective' ? false : false, // Set to false for subjective questions
//         score: 0
//       }))
//     })

//     console.log('Active test created:', activeTest)

//     // Create Completed Test
//     const completedTest = await Test.create({
//       _id: new mongoose.Types.ObjectId(),
//       userId: user._id,
//       testName: 'Science Quiz',
//       category: 'Science',
//       status: 'completed',
//       duration: 20,
//       dueDate: new Date(), // Set a due date
//       createdAt: new Date(),
//       totalScore: 2,
//       answers: questions.map(q => ({
//         questionId: q._id,
//         answer: q.correctAnswer ? q.correctAnswer : 'Subjective Answer',
//         correctAnswer: q.correctAnswer || 'No correct answer provided',
//         isCorrect: q.correctAnswer ? true : false, // Set to false for subjective questions
//         score: q.correctAnswer ? 1 : 2
//       }))
//     })

//     console.log('Completed test created:', completedTest)
//     console.log('Database seeding complete!')

//     process.exit()
//   } catch (error) {
//     console.error('Error seeding database:', error)
//     process.exit(1)
//   }
// }

// // Run seed function
// seedDatabase()

// const mongoose = require('mongoose')
// const { v4: uuidv4 } = require('uuid')

// const userId = new mongoose.Types.ObjectId('67ced265629ef8d97a1a98ad')

// const generateRandomBoolean = () => Math.random() < 0.5

// const generateRandomScore = isCorrect =>
//   isCorrect ? Math.floor(Math.random() * 10) + 1 : 0

// const categories = ['Math', 'Science', 'English', 'History', 'Programming']
// const statuses = ['pending', 'completed', 'in-progress']

// const generateMockTest = () => {
//   const testName = `Test-${uuidv4().slice(0, 8)}`
//   const category = categories[Math.floor(Math.random() * categories.length)]
//   const status = statuses[Math.floor(Math.random() * statuses.length)]
//   const duration = Math.floor(Math.random() * 60) + 30 // 30-90 minutes
//   const dueDate = new Date(Date.now() + Math.floor(Math.random() * 100000000))

//   const answers = Array.from({ length: 5 }, () => {
//     const questionId = new mongoose.Types.ObjectId()
//     const correctAnswer = `Answer ${Math.floor(Math.random() * 4) + 1}`
//     const answer = generateRandomBoolean()
//       ? correctAnswer
//       : `Answer ${Math.floor(Math.random() * 4) + 1}`
//     const isCorrect = answer === correctAnswer
//     const score = generateRandomScore(isCorrect)

//     return { questionId, answer, correctAnswer, isCorrect, score }
//   })

//   const totalScore = answers.reduce((sum, ans) => sum + ans.score, 0)

//   return {
//     userId,
//     testName,
//     category,
//     status,
//     duration,
//     dueDate,
//     createdAt: new Date(),
//     totalScore,
//     answers
//   }
// }

// // Generate 30 test data sets for Emmanuel
// const mockTests = Array.from({ length: 30 }, generateMockTest)

// console.log(JSON.stringify(mockTests, null, 2))

const mongoose = require('mongoose')
const Test = require('./models/Test') // Adjust the path to your Test model
const Question = require('./models/Question')

require('dotenv').config()

const questionData = []

// const categories = {
//   Mathematics: [
//     {
//       questionText: 'What is the derivative of 3x²?',
//       questionType: 'objective',
//       options: ['3x', '6x', 'x²', '9x'],
//       correctAnswer: '6x'
//     },
//     {
//       questionText: 'Solve: 5x - 7 = 3',
//       questionType: 'objective',
//       options: ['x = 2', 'x = -2', 'x = 5', 'x = 1'],
//       correctAnswer: 'x = 2'
//     },
//     {
//       questionText: 'What is the area of a circle with radius 7cm?',
//       questionType: 'objective',
//       options: ['154 cm²', '49 cm²', '77 cm²', '21 cm²'],
//       correctAnswer: '154 cm²'
//     },
//     {
//       questionText: 'Explain the concept of limits in calculus.',
//       questionType: 'subjective',
//       options: [],
//       correctAnswer:
//         'A limit is the value that a function approaches as the input approaches a certain point.'
//     },
//     {
//       questionText: 'Find the integral of x² dx.',
//       questionType: 'subjective',
//       options: [],
//       correctAnswer: 'The integral of x² is (x³)/3 + C.'
//     }
//   ],
//   Science: [
//     {
//       questionText: 'What is the chemical symbol for Gold?',
//       questionType: 'objective',
//       options: ['Au', 'Ag', 'Fe', 'Hg'],
//       correctAnswer: 'Au'
//     },
//     {
//       questionText: 'Which planet is known as the Red Planet?',
//       questionType: 'objective',
//       options: ['Mars', 'Venus', 'Jupiter', 'Saturn'],
//       correctAnswer: 'Mars'
//     },
//     {
//       questionText: "What is Newton's Second Law of Motion?",
//       questionType: 'subjective',
//       options: [],
//       correctAnswer: 'F = ma (Force equals mass times acceleration).'
//     },
//     {
//       questionText: 'Explain the process of photosynthesis.',
//       questionType: 'subjective',
//       options: [],
//       correctAnswer:
//         'Photosynthesis is the process by which green plants convert light energy into chemical energy using carbon dioxide and water.'
//     },
//     {
//       questionText: 'Which gas do plants use for photosynthesis?',
//       questionType: 'objective',
//       options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'],
//       correctAnswer: 'Carbon Dioxide'
//     }
//   ]
// }

// Generating 5 questions for each active test
// const activeTestIds = [
//   '67cf3b0e529ef8d97a1a98aa', // Replace with actual active test IDs
//   '67cf3b0e529ef8d97a1a98bb',
//   '67cf3b0e529ef8d97a1a98cc'
// ]

// for (let testId of activeTestIds) {
//   const category = Math.random() > 0.5 ? 'Mathematics' : 'Science'

//   for (let i = 0; i < 5; i++) {
//     questionData.push({
//       category: category,
//       questionText: categories[category][i].questionText,
//       questionType: categories[category][i].questionType,
//       options: categories[category][i].options,
//       correctAnswer: categories[category][i].correctAnswer
//     })
//   }
// }

// ✅ Connect to MongoDB first
const insertQuestionData = async () => {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(process.env.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })

    console.log('Database connected successfully!')

    // Insert new questions if needed
    await Question.insertMany(questionData)
    console.log('✅ Questions inserted successfully!')

    // Fetch all Science questions
    const scienceQuestions = await Question.find({ category: 'Science' })

    // Extract their IDs
    const questionIds = scienceQuestions.map(q => q._id)

    // Update Test 35 to include these questions
    await Test.findByIdAndUpdate(
      '67d05a92cac1f3ba99acba8f',
      { $set: { questions: questionIds } },
      { new: true }
    )

    console.log('✅ Test 35 updated with Science questions!')

    // Disconnect from DB
    mongoose.disconnect()
  } catch (error) {
    console.error('❌ Error:', error)
    mongoose.disconnect()
  }
}

insertQuestionData()

// mongoose
//   .connect(process.env.DB_URI)
//   .then(() => console.log('MongoDB connected!'))
//   .catch(err => console.log('MongoDB connection failed', err))

// const insertTestData = async () => {
//   try {
//     await Test.insertMany(testData)
//     console.log('Test data inserted successfully for Emmanuel!')
//     mongoose.disconnect()
//   } catch (error) {
//     console.error('Error inserting test data:', error)
//   }
// }

// insertTestData()
