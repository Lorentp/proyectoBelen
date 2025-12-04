const mongoose = require("mongoose");

const AppointmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  service: { type: String, required: true },
  date: { type: String, required: true },   // YYYY-MM-DD
  time: { type: String, required: true },   // HH:mm
  paymentStatus: { type: String, default: "pending" }, 
  mpPaymentId: { type: String, default: "" }
});

module.exports = mongoose.model("Appointment", AppointmentSchema);