const express = require("express");

const {
  createEstimate,
  getEstimates,
  respondToEstimate,
} = require("../controllers/estimateController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createEstimate);

router.get("/", protect, getEstimates);

router.patch("/:id/respond", protect, respondToEstimate);

module.exports = router;
