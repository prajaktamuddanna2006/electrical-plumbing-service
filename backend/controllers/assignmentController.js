const Assignment = require("../models/Assignment");
const ServiceRequest = require("../models/ServiceRequest");

// Create Assignment
const createAssignment = async (req, res) => {
  try {
    const {
      serviceRequest,
      technician,
      scheduledDate,
      priority
    } = req.body;

    if (!serviceRequest || !technician || !scheduledDate) {
      return res.status(400).json({
        message: "Please fill all required fields"
      });
    }

    const request = await ServiceRequest.findById(serviceRequest);

    if (!request) {
      return res.status(404).json({
        message: "Service request not found"
      });
    }

    const assignment = await Assignment.create({
      serviceRequest,
      technician,
      assignedBy: req.user.id,
      scheduledDate,
      priority: priority || "medium"
    });

    request.assignedTechnician = technician;
    request.status = "assigned";

    await request.save();

    res.status(201).json({
      message: "Technician assigned successfully",
      assignment
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to assign technician",
      error: error.message
    });
  }
};

// Get All Assignments
const getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate("serviceRequest")
      .populate("technician", "name email phone")
      .populate("assignedBy", "name email")
      .sort({ createdAt: -1 });

    res.json(assignments);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch assignments",
      error: error.message
    });
  }
};

module.exports = {
  createAssignment,
  getAssignments
};