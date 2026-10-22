const express = require("express");

const {
  createAssignment,
  getAssignments
} = require("../controllers/assignmentController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createAssignment);

router.get("/", protect, getAssignments);

module.exports = router;