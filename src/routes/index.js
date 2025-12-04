const express = require("express");
const router = express.Router();

const serviceRoutes = require("./serviceRoutes");
const appointmentRoutes = require("./appointmentRoutes");
const paymentRoutes = require("./paymentRoutes");
const webhookRoutes = require("./webhookRoutes");
const adminRoutes = require("./adminRoutes");

// Home page (optional)
router.get("/", (req, res) => {
  res.render("home");
});

// Mount route groups
router.use("/services", serviceRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/payments", paymentRoutes);
router.use("/webhook", webhookRoutes);
router.use("/admin", adminRoutes);

module.exports = router;