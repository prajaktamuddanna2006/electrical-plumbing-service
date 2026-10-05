const mongoose = require("mongoose");

const serviceRequestSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    problem: {
      type: String,
      required: true,
      trim: true
    },

    category: {
      type: String,
      enum: ["Electrical", "Plumbing", "Appliance"],
      required: true
    },

    preferredTime: {
      type: String,
      required: true
    },

    location: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["Pending", "Assigned", "In Progress", "Completed", "Cancelled"],
      default: "Pending"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("ServiceRequest", serviceRequestSchema);