const ServiceRequest = require("../models/ServiceRequest");

// Create Service Request
const createServiceRequest = async (req, res) => {
  try {
    const { problem, category, preferredTime, location } = req.body;

    if (!problem || !category || !preferredTime || !location) {
      return res.status(400).json({
        message: "All service request fields are required"
      });
    }

    const serviceRequest = await ServiceRequest.create({
      customer: req.user.id,
      problem,
      category,
      preferredTime,
      location
    });

    res.status(201).json({
      message: "Service request created successfully",
      serviceRequest
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create service request",
      error: error.message
    });
  }
};

// Get All Service Requests
const getServiceRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find()
      .populate("customer", "name email")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch service requests",
      error: error.message
    });
  }
};

module.exports = {
  createServiceRequest,
  getServiceRequests
};