const Appointment = require("../models/Appointment");
const moment = require("moment");
const whatsapp = require("./whatsappController");

module.exports = {
  async sendDailyReminders() {
    try {
      const tomorrow = moment().add(1, "day").format("YYYY-MM-DD");

      const appointments = await Appointment.find({
        date: tomorrow,
        status: "confirmed"
      }).lean();

      for (let appt of appointments) {
        const message = `Hello ${appt.name}! This is a reminder for your appointment tomorrow at ${appt.time}.`;
        await whatsapp.sendMessage(appt.phone, message);
      }

    } catch (error) {
      console.error("Error sending reminders:", error);
    }
  }
};