const mongoose = require("mongoose");

const serviceRequestSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    serviceType: {
      type: String,
      enum: ["electrical", "plumbing"],
      required: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "assigned",
        "inspection",
        "approved",
        "in-progress",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },

    preferredDate: {
      type: Date,
    },

    assignedTechnician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ServiceRequest", serviceRequestSchema);