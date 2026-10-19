const Technician = require("../models/Technician");
const Assignment = require("../models/Assignment");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Create Technician User and Profile (Admin only)
const createTechnician = async (req, res) => {
  let createdUserId = null;

  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admin can create technicians",
      });
    }

    const {
      name,
      email,
      phone,
      password,
      skills,
      serviceArea,
      availability,
      experience,
    } = req.body;

    if (
      !name?.trim() ||
      !email?.trim() ||
      !phone?.trim() ||
      !password ||
      !Array.isArray(skills) ||
      skills.length === 0 ||
      !serviceArea?.trim()
    ) {
      return res.status(400).json({
        message: "Please fill all required fields",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "This email already exists. Use a different email.",
      });
    }

    if (
      availability !== undefined &&
      !["available", "unavailable"].includes(availability)
    ) {
      return res.status(400).json({
        message: "Invalid availability value",
      });
    }

    const cleanSkills = skills
      .filter((skill) => typeof skill === "string")
      .map((skill) => skill.trim())
      .filter(Boolean);

    if (cleanSkills.length === 0) {
      return res.status(400).json({
        message: "Enter at least one valid skill",
      });
    }

    const parsedExperience = Number(experience ?? 0);

    if (
      !Number.isFinite(parsedExperience) ||
      parsedExperience < 0
    ) {
      return res.status(400).json({
        message: "Experience must be a valid non-negative number",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: hashedPassword,
      role: "technician",
      address: serviceArea.trim(),
    });

    createdUserId = user._id;

    const technician = await Technician.create({
      user: user._id,
      skills: cleanSkills,
      serviceArea: serviceArea.trim(),
      availability: availability || "available",
      experience: parsedExperience,
    });

    return res.status(201).json({
      message: "Technician account and profile created successfully",
      technician: {
        _id: technician._id,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        skills: technician.skills,
        serviceArea: technician.serviceArea,
        availability: technician.availability,
        experience: technician.experience,
      },
    });
  } catch (error) {
    // If profile creation fails after user creation, clean up
    // only the newly created user from this request.
    if (createdUserId) {
      try {
        await User.findByIdAndDelete(createdUserId);
      } catch (cleanupError) {
        console.error(
          "Could not clean up incomplete technician user:",
          cleanupError.message
        );
      }
    }

    if (error.code === 11000) {
      return res.status(409).json({
        message: "This email already exists. Use a different email.",
      });
    }

    console.error("Create technician error:", error.message);

    return res.status(500).json({
      message: "Failed to create technician",
      error: error.message,
    });
  }
};

// Get All Technicians (Admin only)
const getTechnicians = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admin can view all technicians",
      });
    }

    const technicians = await Technician.find()
      .populate("user", "name email phone role")
      .sort({ createdAt: -1 });

    return res.json(technicians);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch technicians",
      error: error.message,
    });
  }
};

// Get jobs assigned to the logged-in technician
const getMyAssignments = async (req, res) => {
  try {
    if (req.user.role !== "technician") {
      return res.status(403).json({
        message: "Only technicians can view their assigned jobs",
      });
    }

    const assignments = await Assignment.find({
      technician: req.user.id,
      status: { $ne: "cancelled" },
    })
      .populate({
        path: "serviceRequest",
        match: { status: { $ne: "cancelled" } },
        populate: {
          path: "customer",
          select: "name email phone",
        },
      })
      .sort({ scheduledDate: 1 });

    const technicianAssignments = assignments.filter(
      (assignment) => assignment.serviceRequest !== null
    );

    return res.json({
      count: technicianAssignments.length,
      assignments: technicianAssignments,
    });
  } catch (error) {
    console.error("Failed to fetch assigned jobs:", error.message);

    return res.status(500).json({
      message: "Failed to fetch assigned jobs",
      error: error.message,
    });
  }
};

module.exports = {
  createTechnician,
  getTechnicians,
  getMyAssignments,
};
