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
      .populate("assignedTechnician", "name email")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch service requests",
      error: error.message
    });
  }
};

// Update Service Request Status
const updateServiceRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "assigned",
      "inspection",
      "approved",
      "in-progress",
      "completed",
      "cancelled"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status"
      });
    }

    const serviceRequest = await ServiceRequest.findById(
      req.params.id
    );

    if (!serviceRequest) {
      return res.status(404).json({
        message: "Service request not found"
      });
    }

    serviceRequest.status = status;

    await serviceRequest.save();

    res.json({
      message: "Service request status updated successfully",
      serviceRequest
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update service request status",
      error: error.message
    });
  }
};

module.exports = {
  createServiceRequest,
  getServiceRequests,
  updateServiceRequestStatus
};