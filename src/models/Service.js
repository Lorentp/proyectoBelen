const mongoose = require("mongoose");

const ServiceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  // Duración del servicio en minutos (para bloquear turnos por rango)
  duration: {
    type: Number,
    required: true,
    default: 30
  },
  price: {
    type: Number,
    required: true,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Service", ServiceSchema);
