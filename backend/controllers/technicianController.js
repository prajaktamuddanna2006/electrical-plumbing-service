const Technician = require("../models/Technician");

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

module.exports = {
  createTechnician,
  getTechnicians
};