require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Course = require("./models/Courses"); // confirm your file name — should match actual model file
const Question = require("./models/Question");
const Test = require("./models/Test");

// ====== CONNECT TO DATABASE ======
mongoose
  .connect(process.env.DB_URI)
  .then(() => console.log("✅ MongoDB connected for seeding"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err));

// ====== SEED USERS ======
async function seedUsers() {
  try {
    const count = await User.countDocuments();
    if (count > 0) {
      console.log("🟡 Users already exist, skipping user seed.");
      return;
    }

    const users = [];
    for (let i = 1; i <= 10; i++) {
      users.push({
        username: `user${i}`,
        email: `user${i}@example.com`,
        password: `hashedpassword${i}`, // In production, use bcrypt to hash
        userNumber: 1000 + i,
        subscription: {
          status: Math.random() > 0.4 ? "active" : "inactive",
          plan: Math.random() > 0.7 ? "premium" : "basic",
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    await User.insertMany(users);
    console.log(`✅ ${users.length} users seeded successfully.`);
  } catch (error) {
    console.error("❌ Error seeding users:", error);
  }
}

// ====== SEED COURSES ======
async function seedCourses() {
  try {
    const count = await Course.countDocuments();
    if (count > 0) {
      console.log("🟡 Courses already exist, skipping course seed.");
      return;
    }

    const sampleCourses = [
      {
        name: "Introduction to Programming",
        code: "CSC101",
        level: "100",
        description:
          "Covers basic programming concepts, syntax, and algorithms.",
      },
      {
        name: "Engineering Mathematics",
        code: "MTH102",
        level: "100",
        description:
          "Focuses on calculus, algebra, and mathematical modeling for engineers.",
      },
      {
        name: "Physics for Engineers",
        code: "PHY103",
        level: "100",
        description:
          "Explores mechanics, energy, and thermodynamics principles for engineering applications.",
      },
      {
        name: "Data Structures",
        code: "CSC202",
        level: "200",
        description:
          "Introduces data organization methods, algorithms, and complexity analysis.",
      },
      {
        name: "Thermodynamics",
        code: "MEC204",
        level: "200",
        description:
          "Explains the principles of thermodynamics and their engineering applications.",
      },
    ];

    await Course.insertMany(sampleCourses);
    console.log(`✅ ${sampleCourses.length} courses seeded successfully.`);
  } catch (error) {
    console.error("❌ Error seeding courses:", error);
  }
}

// ====== SEED TESTS AND QUESTIONS ======
async function seedTests() {
  try {
    const users = await User.find({}).select("_id");
    const courses = await Course.find({}).select("_id name code level");

    if (users.length === 0 || courses.length === 0) {
      console.log("⚠️ Please seed users and courses first.");
      return;
    }

    console.log("🧩 Creating dummy questions...");
    const createdQuestions = [];

    for (const course of courses) {
      // Create 5 objective + 5 theory questions per course
      for (let i = 1; i <= 5; i++) {
        const options = [
          "A. Option A (correct)",
          "B. Option B",
          "C. Option C",
          "D. Option D",
        ];

        const objQ = await Question.create({
          course: course._id,
          questionText: `What is Objective Q${i} for ${course.name}?`,
          questionType: "objective",
          options,
          correctAnswer: "A",
          explanation: "A is correct because it best explains the concept.",
          points: 2,
          difficulty: "easy",
        });

        createdQuestions.push(objQ);
      }

      for (let i = 1; i <= 5; i++) {
        const theoryQ = await Question.create({
          course: course._id,
          questionText: `Discuss Theory Q${i} related to ${course.name}.`,
          questionType: "theory",
          correctAnswer: "A detailed explanation including key ideas.",
          explanation: "Used for grading consistency.",
          keywords: [
            { term: "analysis", weight: 0.4 },
            { term: "application", weight: 0.6 },
          ],
          points: 5,
          difficulty: "medium",
        });

        createdQuestions.push(theoryQ);
      }
    }

    console.log(`✅ ${createdQuestions.length} questions created.`);

    console.log("🧠 Creating test documents...");
    const tests = [];

    for (let i = 0; i < 20; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const course = courses[Math.floor(Math.random() * courses.length)];

      const courseQuestions = createdQuestions.filter(
        (q) => String(q.course) === String(course._id)
      );

      const objectiveQs = courseQuestions
        .filter((q) => q.questionType === "objective")
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      const theoryQs = courseQuestions
        .filter((q) => q.questionType === "theory")
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);

      const selectedQs = [...objectiveQs, ...theoryQs];
      const now = new Date();
      const duration = 30; // minutes
      const totalScore = selectedQs.reduce((sum, q) => sum + q.points, 0);

      tests.push({
        userId: user._id,
        course: course._id,
        courseCode: course.code,
        testName: `${course.code} Test ${i + 1}`,
        level: course.level,
        questions: selectedQs.map((q) => q._id),
        duration,
        startTime: now,
        endTime: new Date(now.getTime() + duration * 60000),
        totalScore,
        status: Math.random() > 0.5 ? "new" : "completed",
        createdAt: now,
      });
    }

    await Test.insertMany(tests);
    console.log(`✅ ${tests.length} tests created successfully.`);
  } catch (err) {
    console.error("❌ Error seeding tests:", err);
  } finally {
    mongoose.disconnect();
    console.log("🔌 MongoDB disconnected after seeding.");
  }
}

// ====== RUN SEEDING SEQUENCE ======
(async () => {
  await seedUsers();
  await seedCourses();
  await seedTests();
})();
