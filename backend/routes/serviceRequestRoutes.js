const express = require("express");

const {
  createServiceRequest,
  getServiceRequests,
  updateServiceRequestStatus
} = require("../controllers/serviceRequestController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

console.log("SERVICE REQUEST ROUTES LOADED");

router.post("/", protect, createServiceRequest);

router.get("/", protect, getServiceRequests);

router.put("/:id", protect, updateServiceRequestStatus);

module.exports = router;