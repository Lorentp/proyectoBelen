const express = require("express");
const router = express.Router();
const webhookController = require("../controllers/webhookController");

// POST /webhook/mercadopago → MP notifications
router.post("/mercadopago", webhookController.handleMercadoPagoWebhook);

module.exports = router;