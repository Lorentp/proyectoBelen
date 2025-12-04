const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/serviceController");

// GET /services → list all services
router.get("/", serviceController.getAllServices);

// GET /services/:id → show detail of one service
router.get("/:id", serviceController.getServiceById);

// POST /services → create a new service (admin use)
router.post("/", serviceController.createService);

module.exports = router;