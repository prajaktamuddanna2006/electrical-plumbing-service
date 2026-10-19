
const Invoice = require("../models/Invoice");
const WorkOrder = require("../models/WorkOrder");
const Estimate = require("../models/Estimate");
const ServiceRequest = require("../models/ServiceRequest");

async function createInvoice(req, res) {
  try {
    if (!["admin", "technician"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Only admin or technician can create invoices.",
      });
    }

    const { workOrderId } = req.body;

    if (!workOrderId) {
      return res.status(400).json({
        message: "Work Order ID is required.",
      });
    }

    const workOrder = await WorkOrder.findById(workOrderId);

    if (!workOrder) {
      return res.status(404).json({
        message: "Work Order not found.",
      });
    }

    const existing = await Invoice.findOne({
      workOrder: workOrder._id,
    });

    if (existing) {
      return res.status(200).json({
        message: "Invoice already exists for this work order.",
        invoice: existing,
      });
    }

    const estimate = await Estimate.findById(workOrder.estimate);

    if (!estimate || estimate.status !== "approved") {
      return res.status(400).json({
        message: "An approved estimate is required to create an invoice.",
      });
    }

    const request = await ServiceRequest.findById(
      workOrder.serviceRequest
    );

    if (!request) {
      return res.status(404).json({
        message: "Service request not found.",
      });
    }

    if (req.user.role === "technician") {
      const isAssignedTechnician =
        String(workOrder.technician) === String(req.user.id) &&
        String(estimate.technician) === String(req.user.id);

      if (!isAssignedTechnician) {
        return res.status(403).json({
          message: "You cannot create an invoice for this work order.",
        });
      }
    }

    if (!request.customer) {
      return res.status(400).json({
        message: "Customer information is missing.",
      });
    }

    const invoiceNumber =
      `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const invoice = await Invoice.create({
      invoiceNumber,
      serviceRequest: request._id,
      workOrder: workOrder._id,
      estimate: estimate._id,
      customer: request.customer,
      technician: workOrder.technician,
      totalAmount: estimate.totalCost,
      paymentStatus: "pending",
    });

    return res.status(201).json({
      message: "Invoice created successfully.",
      invoice,
    });
  } catch (error) {
    console.error("Create invoice error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "An invoice already exists for this work order.",
      });
    }

    return res.status(500).json({
      message: "Failed to create invoice.",
    });
  }
}

async function getInvoices(req, res) {
  try {
    const filter = {};

    if (req.user.role === "customer") {
      const requests = await ServiceRequest.find({
        customer: req.user.id,
      }).select("_id");

      filter.serviceRequest = {
        $in: requests.map((request) => request._id),
      };
    } else if (req.user.role === "technician") {
      filter.technician = req.user.id;
    } else if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "You cannot view invoices.",
      });
    }

    const invoices = await Invoice.find(filter)
      .populate("serviceRequest")
      .populate("workOrder")
      .populate("estimate")
      .populate("customer", "name email phone")
      .populate("technician", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ invoices });
  } catch (error) {
    console.error("Get invoices error:", error);

    return res.status(500).json({
      message: "Failed to fetch invoices.",
    });
  }
}


async function recordPayment(req, res) {
  try {
    const { paymentMethod } = req.body;

    const allowedMethods = ["cash", "upi", "card", "other"];

    if (!allowedMethods.includes(paymentMethod)) {
      return res.status(400).json({
        message: "Please select a valid payment method.",
      });
    }

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found.",
      });
    }

    if (
      req.user.role === "customer" &&
      String(invoice.customer) !== String(req.user.id)
    ) {
      return res.status(403).json({
        message: "You cannot pay another customer's invoice.",
      });
    }

    if (!["customer", "admin"].includes(req.user.role)) {
      return res.status(403).json({
        message: "You cannot record payment for this invoice.",
      });
    }

    if (invoice.paymentStatus === "paid") {
      return res.status(400).json({
        message: "This invoice is already marked as paid.",
      });
    }

    invoice.paymentStatus = "paid";
    invoice.paymentMethod = paymentMethod;
    invoice.paidAt = new Date();

    await invoice.save();

    return res.status(200).json({
      message: "Payment recorded successfully.",
      invoice,
    });
  } catch (error) {
    console.error("Record payment error:", error);
    return res.status(500).json({
      message: "Failed to record payment.",
    });
  }
}

module.exports = { createInvoice, getInvoices, recordPayment };

