const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./db");
const authRoutes = require("./routes/authRoutes");
const serviceRequestRoutes = require("./routes/serviceRequestRoutes");

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/service-requests", serviceRequestRoutes);

app.get("/", (req, res) => {
  res.send("Electrical & Plumbing Service API is running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});