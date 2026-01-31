const mongoose = require("mongoose");

const AppointmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  service: { type: String, required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service", default: null },
  date: { type: String, required: true },   // YYYY-MM-DD
  time: { type: String, required: true },   // HH:mm
  durationMinutes: { type: Number, default: 60 },
  paymentStatus: { type: String, default: "pending" },
  mpPaymentId: { type: String, default: "" },

  // Recordatorio automático 24h antes
  reminder24hSentAt: { type: Date, default: null }
});

module.exports = mongoose.model("Appointment", AppointmentSchema);
