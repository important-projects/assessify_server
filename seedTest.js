const mongoose = require('mongoose');
const Test = require('./models/Test'); // Assuming Test model is in './models/Test'
const Question = require('./models/Question');
const User = require('./models/User'); // Assuming User model exists
const Courses = require('./models/Courses'); // Assuming Courses model exists
require('dotenv').config();

mongoose
  .connect(process.env.DB_URI)
  .then(() => console.log('MongoDB connected for test seeding'))
  .catch(err => console.log('MongoDB connection failed', err));

async function seedTests() {
  try {
    // Fetch all users, courses, and questions
    const users = await User.find({}).select('_id');
    const courses = await Courses.find({}).select('_id name');
    const questions = await Question.find({}).select('_id course');

    if (users.length === 0 || courses.length === 0 || questions.length === 0) {
      console.log('Please ensure Users, Courses, and Questions are seeded.');
      return mongoose.disconnect();
    }

    // Define sample test data
    const testData = [];

    // Create 5 sample tests for different users and courses
    for (let i = 0; i < 5; i++) {
      // Randomly select a user
      const user = users[Math.floor(Math.random() * users.length)];

      // Randomly select a course
      const course = courses[Math.floor(Math.random() * courses.length)];

      // Filter questions for the selected course
      const courseQuestions = questions.filter(q => q.course === course.name);

      // Select 5 random questions from the course (or fewer if not enough questions)
      const selectedQuestions = courseQuestions
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.min(5, courseQuestions.length));

      // Generate mock answer IDs and calculate totalScore
      const answers = selectedQuestions.map(() => new mongoose.Types.ObjectId());
      const totalScore = Math.floor(Math.random() * (selectedQuestions.length * 10)) + 1; // Random score between 1 and max possible

      // Randomly assign status
      const status = Math.random() > 0.5 ? 'new' : 'completed';

      testData.push({
        userId: user._id,
        course: course._id,
        answers: answers,
        totalScore: totalScore,
        createdAt: new Date(),
        status: status,
        questions: selectedQuestions.map(q => q._id),
      });
    }

    // Insert test data
    await Test.insertMany(testData);
    console.log('Tests seeded successfully');
  } catch (err) {
    console.error('Error seeding tests:', err);
  } finally {
    mongoose.disconnect();
  }
}

seedTests();

module.exports = seedTests;