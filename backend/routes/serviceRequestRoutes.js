const express = require("express");

const {
  createServiceRequest,
  getServiceRequests,
  updateServiceRequestStatus
} = require("../controllers/serviceRequestController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

console.log("SERVICE REQUEST ROUTES LOADED");

// Create Service Request
router.post("/", protect, createServiceRequest);

// Get All Service Requests
router.get("/", protect, getServiceRequests);

// Update Service Request Status
router.put("/:id", protect, updateServiceRequestStatus);

module.exports = router;