
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const {
  createInvoice,
  getInvoices,
  recordPayment,
} = require("../controllers/invoiceController");

router.post("/", protect, createInvoice);
router.get("/", protect, getInvoices);
router.post("/:id/pay", protect, recordPayment);

module.exports = router;
