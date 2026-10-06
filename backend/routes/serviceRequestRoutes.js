const express = require("express");

const router = express.Router();

console.log("SERVICE REQUEST ROUTES LOADED");

router.get("/", (req, res) => {
  res.json({
    message: "Service request route is working"
  });
});

router.post("/", (req, res) => {
  res.json({
    message: "Service request POST route is working"
  });
});

module.exports = router;

