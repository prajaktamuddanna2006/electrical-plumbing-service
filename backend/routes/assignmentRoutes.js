const express = require("express");

const {
  createAssignment,
  getAssignments
} = require("../controllers/assignmentController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Create Assignment
router.post("/", protect, createAssignment);

// Get All Assignments
router.get("/", protect, getAssignments);

module.exports = router;