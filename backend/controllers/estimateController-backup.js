
const Estimate = require("../models/Estimate");
const ServiceRequest = require("../models/ServiceRequest");

// Create Estimate (Technician only)
const createEstimate = async (req, res) => {
  try {
    if (req.user.role !== "technician") {
      return res.status(403).json({
        message: "Only technicians can create estimates",
      });
    }

    const {
      serviceRequest,
      inspectionNotes,
      laborCost,
      partsCost,
    } = req.body;

    if (
      !serviceRequest ||
      !inspectionNotes ||
      laborCost === undefined ||
      partsCost === undefined
    ) {
      return res.status(400).json({
        message: "Please fill all required fields",
      });
    }

    if (
      !Number.isFinite(laborCost) ||
      !Number.isFinite(partsCost) ||
      laborCost < 0 ||
      partsCost < 0
    ) {
      return res.status(400).json({
        message: "Labor cost and parts cost must be valid non-negative numbers",
      });
    }

    const request = await ServiceRequest.findById(serviceRequest);

    if (!request) {
      return res.status(404).json({
        message: "Service request not found",
      });
    }

    if (
      !request.assignedTechnician ||
      request.assignedTechnician.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message: "You can create estimates only for your assigned requests",
      });
    }

    const estimate = await Estimate.create({
      serviceRequest,
      technician: req.user.id,
      inspectionNotes,
      laborCost,
      partsCost,
      totalCost: laborCost + partsCost,
    });

    return res.status(201).json({
      message: "Estimate created successfully",
      estimate,
    });
  } catch (error) {
    console.error("Create estimate error:", error.message);

    return res.status(500).json({
      message: "Failed to create estimate",
      error: error.message,
    });
  }
};

// Get Estimates
const getEstimates = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "technician") {
      query.technician = req.user.id;
    } else if (req.user.role === "customer") {
      const requests = await ServiceRequest.find({
        customer: req.user.id,
      }).select("_id");

      query.serviceRequest = {
        $in: requests.map((request) => request._id),
      };
    } else if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "You are not allowed to view estimates",
      });
    }

    const estimates = await Estimate.find(query)
      .populate("serviceRequest")
      .populate("technician", "name email phone")
      .sort({ createdAt: -1 });

    return res.json(estimates);
  } catch (error) {
    console.error("Get estimates error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch estimates",
      error: error.message,
    });
  }
};

module.exports = {
  createEstimate,
  getEstimates,
};
