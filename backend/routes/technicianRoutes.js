
const express = require("express");

const {
  createTechnician,
  getTechnicians,
  getMyAssignments
} = require("../controllers/technicianController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Create Technician
router.post("/", protect, createTechnician);

// Get All Technicians
router.get("/", protect, getTechnicians);

// Get Jobs Assigned to Logged-in Technician
router.get("/my-assignments", protect, getMyAssignments);

module.exports = router;
