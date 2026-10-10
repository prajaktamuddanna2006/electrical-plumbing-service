const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register Customer
const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, role, address } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        message: "Please fill all required fields",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists. Please login.",
      });
    }

    const selectedRole = role || "customer";

    if (selectedRole !== "customer") {
      return res.status(403).json({
        message: "Public registration is only available for customers",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: hashedPassword,
      role: "customer",
      address: address ? address.trim() : "",
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
      },
    });
  } catch (error) {
    console.error("Register error:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Email already exists. Please login.",
      });
    }

    return res.status(500).json({
      message: "Server error during registration",
    });
  }
};

// Login Customer or Registered Technician
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Please enter email and password",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      console.log("Login failed: account not found");
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!user.password) {
      console.error("Login failed: password is not stored correctly");
      return res.status(500).json({
        message: "Account password data needs to be repaired",
      });
    }

    const isPasswordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordMatch) {
      console.log("Login failed: password did not match");
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing in .env");
      return res.status(500).json({
        message: "Server configuration error",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    console.log("Login successful for role:", user.role);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Server error during login",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
};