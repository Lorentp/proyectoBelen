const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const blockedSlotController = require("../controllers/blockedSlotController");

// admin password from env or default
const ADMIN_PASS = process.env.ADMIN_PASS || "1234";

function adminAuth(req, res, next) {
  const pass = req.query.pass || req.body.pass;
  if (pass !== ADMIN_PASS) {
    return res.status(403).send("Acceso no autorizado");
  }
  next();
}

// Dashboard
router.get("/", adminAuth, adminController.getDashboard);

// SERVICES CRUD
router.get("/services", adminAuth, adminController.getServices);
router.post("/services/create", adminAuth, adminController.createService);
router.post("/services/update/:id", adminAuth, adminController.updateService);
router.post("/services/delete/:id", adminAuth, adminController.deleteService);

// APPOINTMENTS - weekly calendar + CRUD from week view
router.get("/appointments-week", adminAuth, adminController.getWeekAppointments);
router.post("/appointments-week/update/:id", adminAuth, adminController.updateAppointmentFromWeek);
router.post("/appointments-week/delete/:id", adminAuth, adminController.deleteAppointmentFromWeek);

// BLOCKED SLOTS (manual blocks)
router.get("/blocks", adminAuth, blockedSlotController.getBlocks);
router.post("/blocks/create", adminAuth, blockedSlotController.createBlock);
router.post("/blocks/delete/:id", adminAuth, blockedSlotController.deleteBlock);

// API to fetch single appointment (used by SweetAlert editor)
router.get("/api/appointment/:id", adminAuth, adminController.getAppointmentById);

module.exports = router;
