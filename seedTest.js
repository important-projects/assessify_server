const mongoose = require('mongoose');
const Test = require('./models/Test');
const Question = require('./models/Question');
const User = require('./models/User');
const Courses = require('./models/Courses');
require('dotenv').config();

mongoose
  .connect(process.env.DB_URI)
  .then(() => console.log('MongoDB connected for test seeding'))
  .catch(err => console.log('MongoDB connection failed', err));

async function seedTests() {
  try {
    const users = await User.find({}).select('_id');
    const courses = await Courses.find({}).select('_id name code level');

    if (users.length === 0 || courses.length === 0) {
      console.log('Please seed users and courses first.');
      return mongoose.disconnect();
    }

    console.log('Creating dummy questions...');
    const createdQuestions = [];

    for (const course of courses) {
      // Create 3 objective questions
      for (let i = 1; i <= 5; i++) {
        const options = [
          'A. Explanation A that meets the 5-character minimum',
          'B. Explanation B that meets the length requirement',
          'C. Another plausible choice that fits',
          'D. Final distractor that sounds believable'
        ];

        const q = await Question.create({
          course: course._id,
          questionText: `What is the answer to Objective Q${i} in ${course.name}?`,
          questionType: 'objective',
          options,
          correctAnswer: 'A', // Must be A–D, matching options
          explanation: 'Option A is the correct one because it best aligns with the concept.',
          points: 2,
          difficulty: 'easy'
        });

        createdQuestions.push(q);
      }

      for (let i = 1; i <= 5; i++) {
        const q = await Question.create({
          course: course._id,
          questionText: `Discuss in detail: Theory Q${i} for ${course.name}.`,
          questionType: 'theory',
          correctAnswer: 'A thorough explanation that includes all required key points.',
          explanation: 'This is a reference explanation to guide the grader.',
          keywords: [
            { term: 'conceptual understanding', weight: 0.4 },
            { term: 'critical analysis', weight: 0.6 }
          ],
          points: 5,
          difficulty: 'medium'
        });

        createdQuestions.push(q);
      }
    }

    console.log(`${createdQuestions.length} dummy questions created.`);

    console.log('Creating test documents...');
    const testData = [];

    for (let i = 0; i < 30; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const course = courses[Math.floor(Math.random() * courses.length)];

      const courseQuestions = createdQuestions.filter(
        q => String(q.course) === String(course._id)
      );

      const objectiveQuestions = courseQuestions
        .filter(q => q.questionType === 'objective')
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      const theoryQuestions = courseQuestions
        .filter(q => q.questionType === 'theory')
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);

      const selectedQuestions = [...objectiveQuestions, ...theoryQuestions];
      
      const now = new Date();
      const duration = 30; // minutes
      const startTime = now;
      const endTime = new Date(now.getTime() + duration * 60000);
      const totalScore = selectedQuestions.reduce((acc, q) => acc + q.points, 0);

      testData.push({
        userId: user._id,
        course: course._id,
        courseCode: course.code || 'GEN101',
        testName: `Sample Test ${i + 1}`,
        level: course.level || '100',
        questions: selectedQuestions.map(q => q._id),
        duration,
        startTime,
        endTime,
        totalScore,
        status: Math.random() > 0.5 ? 'new' : 'completed',
        createdAt: now
      });
    }

    await Test.insertMany(testData);
    console.log('Tests seeded successfully.');

    console.log(`Seed Summary: ${courses.length} courses, ${users.length} users`);
    console.log(`${createdQuestions.length} total questions created.`);
    console.log(`${testData.length} tests created.`);
  } catch (err) {
    console.error('Error seeding tests:', err);
  } finally {
    mongoose.disconnect();
  }



}

seedTests();
