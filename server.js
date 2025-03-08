const express = require("express");
const http = require("http");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const { router: AuthRoutes } = require("./routes/Authentication");
const TestRoutes = require("./routes/Test");
const UserDashboardRoutes = require("./routes/UserDashboard");
const FetchUserRoutes = require("./routes/FetchUser");
const ForumRoutes = require("./routes/Forum")
const dotenv = require("dotenv");

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

mongoose.set("strictPopulate", false);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// cors config
dotenv.config();
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:5173",
      "https://assessify.vercel.app",
      "https://assessify-server.onrender.com"
    ],
    credentials: true,
  })
);
app.use(express.json());

mongoose
  .connect(process.env.DB_URI, {
    serverSelectionTimeoutMS: 100000, // 30 seconds
  })
  .then(() => {
    console.log("MongoDB connected");

    // Only start the server after MongoDB is connected
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
    process.exit(1); // Exit the process with a failure code
  });

app.use("/auth", AuthRoutes);
app.use("/test", TestRoutes);
app.use("/dashboard/user", UserDashboardRoutes);
app.use("/userdetail", FetchUserRoutes);
app.use("/forum", ForumRoutes);

app.get("/current-datetime", (req, res) => {
  try {
    const utcDate = new Date();
    const watDate = new Date(utcDate.getTime() + 1 * 60 * 60 * 1000);

    const options = { year: "numeric", month: "long", day: "numeric" };
    const formattedDate = watDate.toLocaleDateString(undefined, options);

    const option = { month: "long", year: "numeric" };
    const formattedMonth = watDate.toLocaleDateString(undefined, option);
    res.json({ formattedDate, formattedMonth });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Couldn't fetch date" });
  }
});

app.get("/", (req, res) => {
  console.log("Server running");
  res.status(200).json({ message: `Server running on ${PORT}` });
});
