const ServiceRequest = require("../models/ServiceRequest");

const assignRequest = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admin can assign service requests."
      });
    }

    const { technicianId } = req.body;

    if (!technicianId) {
      return res.status(400).json({
        message: "Please provide technicianId."
      });
    }

    const request = await ServiceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        message: "Service request not found."
      });
    }

    request.assignedTechnician = technicianId;
    request.status = "assigned";

    await request.save();

    const updatedRequest = await ServiceRequest.findById(request._id)
      .populate("customer", "name email phone")
      .populate("assignedTechnician", "name email phone");

    return res.status(200).json({
      message: "Technician assigned successfully!",
      request: updatedRequest
    });
  } catch (error) {
    console.error("Assign request error:", error);

    return res.status(500).json({
      message: "Failed to assign technician.",
      error: error.message
    });
  }
};

module.exports = assignRequest;