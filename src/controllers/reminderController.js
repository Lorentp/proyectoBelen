const Appointment = require("../models/Appointment");
const moment = require("moment");
const whatsapp = require("./whatsappController");

module.exports = {
  async send24hReminders() {
    try {
      const windowMinutes = Number(process.env.REMINDER_WINDOW_MINUTES || 10);
      const now = moment();

      // Buscamos turnos que ocurren entre ahora+24h y ahora+24h+ventana
      const start = moment(now).add(24, "hours");
      const end = moment(start).add(windowMinutes, "minutes");

      const datesToCheck = Array.from(
        new Set([start.format("YYYY-MM-DD"), end.format("YYYY-MM-DD")])
      );

      const candidates = await Appointment.find({
        date: { $in: datesToCheck },
        paymentStatus: "approved",
        reminder24hSentAt: null
      }).lean();

      for (const appt of candidates) {
        const apptMoment = moment(`${appt.date} ${appt.time}`, "YYYY-MM-DD HH:mm", true);
        if (!apptMoment.isValid()) continue;

        if (apptMoment.isBefore(start) || !apptMoment.isBefore(end)) continue;

        const message = `Hola ${appt.name}! Recordatorio: tenés turno de ${appt.service} el ${appt.date} a las ${appt.time}.`;
        const ok = await whatsapp.sendMessage(appt.phone, message);

        if (ok) {
          await Appointment.findByIdAndUpdate(appt._id, { reminder24hSentAt: new Date() });
        }
      }

    } catch (error) {
      console.error("Error sending 24h reminders:", error);
    }
  }
};
