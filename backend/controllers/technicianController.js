
const Technician = require("../models/Technician");
const Assignment = require("../models/Assignment");

// Create Technician
const createTechnician = async (req, res) => {
  try {
    const {
      user,
      skills,
      serviceArea,
      availability,
      experience
    } = req.body;

    if (!user || !skills || !serviceArea) {
      return res.status(400).json({
        message: "Please fill all required fields"
      });
    }

    const technician = await Technician.create({
      user,
      skills,
      serviceArea,
      availability: availability || "available",
      experience: experience || 0
    });

    res.status(201).json({
      message: "Technician created successfully",
      technician
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create technician",
      error: error.message
    });
  }
};

// Get All Technicians
const getTechnicians = async (req, res) => {
  try {
    const technicians = await Technician.find()
      .populate("user", "name email phone role")
      .sort({ createdAt: -1 });

    res.json(technicians);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch technicians",
      error: error.message
    });
  }
};

// Get Active Jobs Assigned to Logged-in Technician
const getMyAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({
      technician: req.user.id,
      status: { $nin: ["completed", "cancelled"] }
    })
      .populate({
        path: "serviceRequest",
        match: { status: { $nin: ["completed", "cancelled"] } },
        populate: {
          path: "customer",
          select: "name email phone"
        }
      })
      .sort({ scheduledDate: 1 });

    const activeAssignments = assignments.filter(
      (assignment) => assignment.serviceRequest !== null
    );

    res.json({
      count: activeAssignments.length,
      assignments: activeAssignments
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch assigned jobs",
      error: error.message
    });
  }
};

module.exports = {
  createTechnician,
  getTechnicians,
  getMyAssignments
};
