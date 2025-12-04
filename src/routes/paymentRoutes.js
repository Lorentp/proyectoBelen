const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

router.post("/create", paymentController.createPreference);
router.get("/success", paymentController.paymentSuccess);
router.get("/failure", paymentController.paymentFailure);
router.get("/pending", paymentController.paymentPending);

module.exports = router;
