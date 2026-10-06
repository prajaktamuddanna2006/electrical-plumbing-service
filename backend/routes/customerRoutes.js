const express = require("express");

const {
  addCustomer,
  getCustomers
} = require("../controllers/customerController");

const router = express.Router();

// Add Customer
router.post("/", addCustomer);

// Get All Customers
router.get("/", getCustomers);

module.exports = router;