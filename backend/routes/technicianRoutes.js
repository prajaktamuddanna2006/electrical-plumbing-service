const express = require("express");

const {
  createTechnician,
  getTechnicians
} = require("../controllers/technicianController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Create Technician
router.post("/", protect, createTechnician);

// Get All Technicians
router.get("/", protect, getTechnicians);

module.exports = router;