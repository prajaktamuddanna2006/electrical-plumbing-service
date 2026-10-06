const ServiceRequest = require("../models/ServiceRequest");

// Create Service Request
const createServiceRequest = async (req, res) => {
  try {
    const {
      serviceType,
      description,
      address,
      preferredDate
    } = req.body;

    if (!serviceType || !description || !address) {
      return res.status(400).json({
        message: "Please fill all required fields"
      });
    }

    const serviceRequest = await ServiceRequest.create({
      customer: req.user.id,
      serviceType,
      description,
      address,
      preferredDate
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