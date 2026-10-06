const Customer = require("../models/Customer");

// Add Customer
const addCustomer = async (req, res) => {
  console.log("ADD CUSTOMER API CALLED");

  try {
    const { name, email, phone, address } = req.body;

    const customer = new Customer({
      name,
      email,
      phone,
      address
    });

    await customer.save();

    console.log("CUSTOMER SAVED SUCCESSFULLY");

    res.status(201).json({
      message: "Customer added successfully",
      customer
    });
  } catch (error) {
    console.log("CUSTOMER SAVE ERROR:", error.message);

    res.status(500).json({
      message: "Failed to add customer",
      error: error.message
    });
  }
};

// Get All Customers
const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find();

    res.status(200).json({
      message: "Customers fetched successfully",
      customers
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get customers",
      error: error.message
    });
  }
};

module.exports = {
  addCustomer,
  getCustomers
};