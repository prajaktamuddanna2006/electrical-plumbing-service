
const express = require("express");

const {
  createEstimate,
  getEstimates,
  respondToEstimate,
} = require("../controllers/estimateController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Create Estimate
router.post("/", protect, createEstimate);

// Get Estimates
router.get("/", protect, getEstimates);

// Customer approves or rejects an estimate
router.patch("/:id/respond", protect, respondToEstimate);

module.exports = router;
