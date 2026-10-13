const Assignment = require("../models/Assignment");
const ServiceRequest = require("../models/ServiceRequest");
const Technician = require("../models/Technician");
const User = require("../models/User");

// Create Assignment (Admin only)
const createAssignment = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admin can assign technicians",
      });
    }

    const {
      serviceRequest,
      technician,
      scheduledDate,
      priority,
    } = req.body;

    if (!serviceRequest || !technician || !scheduledDate) {
      return res.status(400).json({
        message: "Please fill all required fields",
      });
    }

    const date = new Date(scheduledDate);

    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({
        message: "Invalid scheduled date",
      });
    }

    if (date < new Date()) {
      return res.status(400).json({
        message: "Scheduled date cannot be in the past",
      });
    }

    if (
      priority !== undefined &&
      !["low", "medium", "high"].includes(priority)
    ) {
      return res.status(400).json({
        message: "Priority must be low, medium, or high",
      });
    }

    const request = await ServiceRequest.findById(serviceRequest);

    if (!request) {
      return res.status(404).json({
        message: "Service request not found",
      });
    }

    if (["completed", "cancelled"].includes(request.status)) {
      return res.status(400).json({
        message: "Cannot assign a completed or cancelled request",
      });
    }

    const technicianUser = await User.findById(technician);

    if (!technicianUser || technicianUser.role !== "technician") {
      return res.status(404).json({
        message: "Technician user not found",
      });
    }

    const technicianProfile = await Technician.findOne({
      user: technician,
    });

    if (!technicianProfile) {
      return res.status(404).json({
        message: "Technician profile not found",
      });
    }

    if (technicianProfile.availability !== "available") {
      return res.status(400).json({
        message: "Technician is currently unavailable",
      });
    }

    const assignment = await Assignment.create({
      serviceRequest,
      technician,
      assignedBy: req.user.id,
      scheduledDate: date,
      priority: priority || "medium",
    });

    request.assignedTechnician = technician;
    request.status = "assigned";

    await request.save();

    return res.status(201).json({
      message: "Technician assigned successfully",
      assignment,
    });
  } catch (error) {
    console.error("Create assignment error:", error.message);

    return res.status(500).json({
      message: "Failed to assign technician",
      error: error.message,
    });
  }
};

// Get All Assignments
const getAssignments = async (req, res) => {
  try {
    if (!["admin", "technician"].includes(req.user.role)) {
      return res.status(403).json({
        message: "You are not allowed to view assignments",
      });
    }

    let query = {};

    // Technicians can see only their own assignments
    if (req.user.role === "technician") {
      query.technician = req.user.id;
    }

    const assignments = await Assignment.find(query)
      .populate("serviceRequest")
      .populate("technician", "name email phone")
      .populate("assignedBy", "name email")
      .sort({ createdAt: -1 });

    return res.json(assignments);
  } catch (error) {
    console.error("Get assignments error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch assignments",
      error: error.message,
    });
  }
};

module.exports = {
  createAssignment,
  getAssignments,
};