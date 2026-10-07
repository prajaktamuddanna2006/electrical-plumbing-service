const mongoose = require("mongoose");

const technicianSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    skills: {
      type: [String],
      required: true,
    },

    serviceArea: {
      type: String,
      required: true,
    },

    availability: {
      type: String,
      enum: ["available", "unavailable"],
      default: "available",
    },

    experience: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Technician", technicianSchema);