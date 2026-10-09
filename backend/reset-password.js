const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const user = await User.findOne({
      email: "prajakta@test.com"
    });

    if (!user) {
      console.log("User not found");
      process.exit();
    }

    user.password = await bcrypt.hash("Prajakta@123", 10);

    await user.save();

    console.log("Password reset successfully");
    console.log("Email: prajakta@test.com");
    console.log("Password: Prajakta@123");

    process.exit();
  } catch (error) {
    console.log("Error:", error.message);
    process.exit(1);
  }
}

resetPassword();