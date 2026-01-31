const mongoose = require("mongoose");

// Bloqueo manual de disponibilidad (por fecha y rango horario)
// date: YYYY-MM-DD
// startTime/endTime: HH:mm
const BlockedSlotSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    reason: { type: String, default: "" }
  },
  { timestamps: true }
);

BlockedSlotSchema.index({ date: 1 });

module.exports = mongoose.model("BlockedSlot", BlockedSlotSchema);

