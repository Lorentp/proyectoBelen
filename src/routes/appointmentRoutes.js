const express = require("express");
const router = express.Router();
const controller = require("../controllers/appoinmentController");

router.get("/book/:id", controller.getBook);
router.get("/select-service", controller.getSelectService);
router.get("/select-date", controller.getSelectDate);
router.get("/available", controller.getAvailableSlots);
router.get("/form-data", controller.getFormData);

router.post("/process-payment", controller.processPayment);

router.get("/payment-success", controller.paymentSuccess);
router.get("/payment-failed", (req, res) =>
  res.render("appointments/paymentFailed", { title: "Pago cancelado" })
);

module.exports = router;
