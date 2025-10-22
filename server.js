const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth");
const userProfileRoute = require("./routes/fetchUser");
const emailRoute = require("./routes/mailer");
const subscriptionRoutes = require("./routes/subscription");
const userDashboardRoutes = require("./routes/userDashboard");
const fetchAdminRoutes = require("./routes/fetchAdmin");
const originAdmin = require("./routes/adminDashboard");
const webhookRoute = require("./routes/webhook");
const testRoutes = require("./routes/test");
const timeConfig = require("./routes/time");

require("dotenv").config();
const PORT = process.env.PORT;

function serverApp() {
  try {
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use(cookieParser());

    app.use(
      cors({
        origin: process.env.ALLOWED_ORIGINS.split(","),
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
      })
    );

    app.use("/auth", authRoutes);
    app.use("/dashboard/user", userDashboardRoutes);
    app.use("/dashboard/test", testRoutes);
    app.use("/details", userProfileRoute);
    app.use("/dashboard/admin", fetchAdminRoutes);
    // app.use('/forum', ForumRoutes)
    app.use("/assessify", emailRoute);
    // app.use('/admin', AdminRoute)
    app.use("/admin/dashboard", originAdmin);
    app.use("/api/subscription", subscriptionRoutes);
    app.use("/api/webhooks", webhookRoute);
    app.use(timeConfig);

    app.get("/", (req, res) => {
      console.log("Server running");
      res.status(200).json({ message: `Server running on ${PORT}` });
    });

    return app;
  } catch (error) {
    console.error("Server setup failed:", error);
    process.exit(1);
  }
}

module.exports = serverApp;
