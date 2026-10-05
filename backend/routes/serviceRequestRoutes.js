const express = require("express");

const {
  createServiceRequest,
  getServiceRequests
} = require("../controllers/serviceRequestController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createServiceRequest);
router.get("/", protect, getServiceRequests);

module.exports = router;