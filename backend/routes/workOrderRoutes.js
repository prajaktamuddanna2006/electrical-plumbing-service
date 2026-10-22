const express = require("express");

const {
  createWorkOrder,
  getWorkOrders,
  updateWorkOrderStatus,
} = require("../controllers/workOrderController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createWorkOrder);
router.get("/", protect, getWorkOrders);
router.patch("/:id/status", protect, updateWorkOrderStatus);

module.exports = router;
