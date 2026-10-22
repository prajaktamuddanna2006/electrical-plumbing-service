const express = require("express");

const {
  addCustomer,
  getCustomers
} = require("../controllers/customerController");

const router = express.Router();

router.post("/", addCustomer);

router.get("/", getCustomers);

module.exports = router;