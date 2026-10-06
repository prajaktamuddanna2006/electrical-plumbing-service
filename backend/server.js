const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./db");

const authRoutes = require("./routes/authRoutes");
const serviceRequestRoutes = require("./routes/serviceRequestRoutes");

const protect = require("./middleware/authMiddleware");

const app = express();

// Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/service-requests", serviceRequestRoutes);

// Home route
app.get("/", (req, res) => {
  res.send("Electrical and plumbing service API is running");
});

// Test route
app.get("/test", (req, res) => {
  res.json({
    message: "Server test route is working"
  });
});

// Protected test route
app.get("/protected", protect, (req, res) => {
  res.json({
    message: "Protected route working",
    user: req.user
  });
});

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});