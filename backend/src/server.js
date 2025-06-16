const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const classesRoute = require("./routes/classes");
const attendanceRoute = require("./routes/attendance");
const gamificationRoute = require("./routes/gamification");
const videosRoute = require("./routes/videos");

const app = express();
const PORT = 5000;

app.get("/api/test", (req, res) => {
  res.status(200).json({ message: "API test successful!" });
});

// Basic middleware
app.use(express.json());
app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/classes", classesRoute);
app.use("/api/attendance", attendanceRoute);
app.use("/api/gamification", gamificationRoute);
app.use("/api/videos", videosRoute);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "GanitHub API is running",
  });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
