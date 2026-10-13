
const express = require("express");

const {
  createEstimate,
  getEstimates,
} = require("../controllers/estimateController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Create Estimate
router.post("/", protect, createEstimate);

// Get Estimates
router.get("/", protect, getEstimates);

module.exports = router;
