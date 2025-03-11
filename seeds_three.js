const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const generateRandomBoolean = () => Math.random() < 0.5;

const generateRandomScore = (isCorrect) => (isCorrect ? Math.floor(Math.random() * 10) + 1 : 0);

const categories = ['Math', 'Science', 'English', 'History', 'Programming'];
const statuses = ['pending', 'completed', 'in-progress'];

const generateMockTest = () => {
  const userId = new mongoose.Types.ObjectId();
  const testName = `Test-${uuidv4().slice(0, 8)}`;
  const category = categories[Math.floor(Math.random() * categories.length)];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const duration = Math.floor(Math.random() * 60) + 30; // 30-90 minutes
  const dueDate = new Date(Date.now() + Math.floor(Math.random() * 100000000));
  
  const answers = Array.from({ length: 5 }, () => {
    const questionId = new mongoose.Types.ObjectId();
    const correctAnswer = `Answer ${Math.floor(Math.random() * 4) + 1}`;
    const answer = generateRandomBoolean() ? correctAnswer : `Answer ${Math.floor(Math.random() * 4) + 1}`;
    const isCorrect = answer === correctAnswer;
    const score = generateRandomScore(isCorrect);
    
    return { questionId, answer, correctAnswer, isCorrect, score };
  });

  const totalScore = answers.reduce((sum, ans) => sum + ans.score, 0);

  return {
    userId,
    testName,
    category,
    status,
    duration,
    dueDate,
    createdAt: new Date(),
    totalScore,
    answers,
  };
};

// Generate 30 test data sets
const mockTests = Array.from({ length: 30 }, generateMockTest);

console.log(JSON.stringify(mockTests, null, 2));
