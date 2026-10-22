const express = require("express");

const {
  createTechnician,
  getTechnicians,
  getMyAssignments
} = require("../controllers/technicianController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createTechnician);

router.get("/", protect, getTechnicians);

router.get("/my-assignments", protect, getMyAssignments);

module.exports = router;
