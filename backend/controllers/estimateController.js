const Estimate = require("../models/Estimate");
const ServiceRequest = require("../models/ServiceRequest");

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
      typeof inspectionNotes !== "string" ||
      !inspectionNotes.trim() ||
      laborCost === undefined ||
      partsCost === undefined
    ) {
      return res.status(400).json({
        message: "Please fill all required fields",
      });
    }

    const labor = Number(laborCost);
    const parts = Number(partsCost);

    if (
      !Number.isFinite(labor) ||
      !Number.isFinite(parts) ||
      labor < 0 ||
      parts < 0
    ) {
      return res.status(400).json({
        message: "Costs must be valid non-negative numbers",
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

    if (["completed", "cancelled"].includes(request.status)) {
      return res.status(400).json({
        message: "Cannot create an estimate for a closed request",
      });
    }


const existingEstimate = await Estimate.findOne({
  serviceRequest,
});

if (existingEstimate) {
  return res.status(409).json({
    message: "An estimate already exists for this request",
  });
}

    const estimate = await Estimate.create({
      serviceRequest,
      technician: req.user.id,
      inspectionNotes: inspectionNotes.trim(),
      laborCost: labor,
      partsCost: parts,
      totalCost: labor + parts,
    });

    return res.status(201).json({
      message: "Estimate created successfully",
      estimate,
    });
  } catch (error) {
    console.error("Create estimate error:", error.message);

    return res.status(500).json({
      message: "Failed to create estimate",
    });
  }
};

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
    });
  }
};

const respondToEstimate = async (req, res) => {
  try {
    if (req.user.role !== "customer") {
      return res.status(403).json({
        message: "Only customers can approve or reject estimates",
      });
    }

    const { status, customerNotes } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be approved or rejected",
      });
    }

    const estimate = await Estimate.findById(req.params.id);

    if (!estimate) {
      return res.status(404).json({
        message: "Estimate not found",
      });
    }

    const request = await ServiceRequest.findById(
      estimate.serviceRequest
    );

    if (!request || request.customer.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You can respond only to your own estimate",
      });
    }

    if (estimate.status !== "pending") {
      return res.status(400).json({
        message: "This estimate has already been answered",
      });
    }

    estimate.status = status;

    if (typeof customerNotes === "string") {
      estimate.customerNotes = customerNotes.trim();
    }

    await estimate.save();

    if (status === "approved") {
      request.status = "approved";
      await request.save();
    }

    return res.json({
      message: `Estimate ${status} successfully`,
      estimate,
    });
  } catch (error) {
    console.error("Respond to estimate error:", error.message);

    return res.status(500).json({
      message: "Failed to update estimate response",
    });
  }
};

module.exports = {
  createEstimate,
  getEstimates,
  respondToEstimate,
};
