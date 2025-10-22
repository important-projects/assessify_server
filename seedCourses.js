const mongoose = require("mongoose");
const Courses = require("./models/courses");
require("dotenv").config();

mongoose
  .connect(process.env.DB_URI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.log("MongoDB connection failed", err);
  });

const courses = [
  { name: "React.JS", description: "React.js course" },
  { name: "PHP", description: "PHP course" },
  { name: "Python", description: "Python course" },
];

seedCourses = async () => {
  await Courses.insertMany(courses);
  console.log("Courses seeded");
  mongoose.disconnect();
};

seedCourses();
