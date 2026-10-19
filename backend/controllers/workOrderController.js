
const WorkOrder = require("../models/WorkOrder");
const Estimate = require("../models/Estimate");
const ServiceRequest = require("../models/ServiceRequest");
const Assignment = require("../models/Assignment");

async function createWorkOrder(req, res) {
  try {
    if (!["admin", "technician"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Only admin or technician can create a work order.",
      });
    }

    const { estimateId, scheduledDate } = req.body;

    if (!estimateId) {
      return res.status(400).json({
        message: "Estimate ID is required.",
      });
    }

    const estimate = await Estimate.findById(estimateId);

    if (!estimate) {
      return res.status(404).json({
        message: "Estimate not found.",
      });
    }

    if (estimate.status !== "approved") {
      return res.status(400).json({
        message: "Only approved estimates can create work orders.",
      });
    }

    const request = await ServiceRequest.findById(
      estimate.serviceRequest
    );

    if (!request) {
      return res.status(404).json({
        message: "Service request not found.",
      });
    }

    if (
      req.user.role === "technician" &&
      (
        !request.assignedTechnician ||
        String(request.assignedTechnician) !== String(req.user.id) ||
        String(estimate.technician) !== String(req.user.id)
      )
    ) {
      return res.status(403).json({
        message:
          "You can create work orders only for your assigned estimates.",
      });
    }

    const technicianId =
      req.user.role === "technician"
        ? req.user.id
        : estimate.technician || request.assignedTechnician;

    if (!technicianId) {
      return res.status(400).json({
        message: "No technician is assigned to this work order.",
      });
    }

    let requestedDate = null;

    if (scheduledDate) {
      requestedDate = new Date(scheduledDate);

      if (Number.isNaN(requestedDate.getTime())) {
        return res.status(400).json({
          message: "Invalid scheduled date.",
        });
      }
    }

    const assignment = await Assignment.findOne({
      serviceRequest: request._id,
      technician: technicianId,
      status: { $ne: "cancelled" },
    }).sort({ createdAt: -1 });

    const finalScheduledDate =
      requestedDate || assignment?.scheduledDate || null;

    // Keep the existing work order and fill missing details.
    const existing = await WorkOrder.findOne({
      estimate: estimate._id,
    });

    if (existing) {
      let changed = false;

      if (!existing.scheduledDate && finalScheduledDate) {
        existing.scheduledDate = finalScheduledDate;
        changed = true;
      }

      // Sync an advanced service-request status to a pending
      // work order without resetting an existing work order.
      const advancedStatuses = [
        "in-progress",
        "completed",
        "cancelled",
      ];

      if (
        existing.status === "pending" &&
        advancedStatuses.includes(request.status)
      ) {
        existing.status = request.status;
        changed = true;
      }

      if (changed) {
        await existing.save();
      }

      return res.status(200).json({
        message: changed
          ? "Existing work order updated successfully."
          : "Work order already exists for this estimate.",
        workOrder: existing,
      });
    }

    const initialStatus = [
      "in-progress",
      "completed",
      "cancelled",
    ].includes(request.status)
      ? request.status
      : "pending";

    const workOrder = await WorkOrder.create({
      serviceRequest: request._id,
      estimate: estimate._id,
      technician: technicianId,
      description: request.description,
      scheduledDate: finalScheduledDate,
      status: initialStatus,
    });

    return res.status(201).json({
      message: "Work order created successfully.",
      workOrder,
    });
  } catch (error) {
    console.error("Create work order error:", error);

    return res.status(500).json({
      message: "Failed to create work order.",
    });
  }
}

async function getWorkOrders(req, res) {
  try {
    const filter = {};

    if (req.user.role === "technician") {
      filter.technician = req.user.id;
    }

    if (req.user.role === "customer") {
      const requests = await ServiceRequest.find({
        customer: req.user.id,
      }).select("_id");

      filter.serviceRequest = {
        $in: requests.map((request) => request._id),
      };
    }

    const workOrders = await WorkOrder.find(filter)
      .populate("serviceRequest")
      .populate("estimate")
      .populate("technician", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ workOrders });
  } catch (error) {
    console.error("Get work orders error:", error);

    return res.status(500).json({
      message: "Failed to fetch work orders.",
    });
  }
}

async function updateWorkOrderStatus(req, res) {
  try {
    const { status, completionNotes } = req.body;

    const allowedStatuses = [
      "pending",
      "in-progress",
      "completed",
      "cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid work order status.",
      });
    }

    const workOrder = await WorkOrder.findById(req.params.id);

    if (!workOrder) {
      return res.status(404).json({
        message: "Work order not found.",
      });
    }

    const isAdmin = req.user.role === "admin";

    const isAssignedTechnician =
      req.user.role === "technician" &&
      String(workOrder.technician) === String(req.user.id);

    if (!isAdmin && !isAssignedTechnician) {
      return res.status(403).json({
        message: "You cannot update this work order.",
      });
    }

    workOrder.status = status;

    if (completionNotes !== undefined) {
      workOrder.completionNotes = completionNotes;
    }

    await workOrder.save();

    return res.status(200).json({
      message: "Work order updated successfully.",
      workOrder,
    });
  } catch (error) {
    console.error("Update work order error:", error);

    return res.status(500).json({
      message: "Failed to update work order.",
    });
  }
}

module.exports = {
  createWorkOrder,
  getWorkOrders,
  updateWorkOrderStatus,
};
