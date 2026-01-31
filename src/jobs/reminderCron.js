const cron = require("node-cron");
const reminder = require("../controllers/reminderController");

// Corre cada 10 minutos para poder disparar el recordatorio "24h antes" con precisión.
// Ajustable con REMINDER_CRON (por defecto */10 * * * *) y REMINDER_WINDOW_MINUTES (por defecto 10).
const expr = process.env.REMINDER_CRON || "*/10 * * * *";
const job = cron.schedule(expr, async () => {
  console.log("Ejecutando recordatorio 24h...");
  await reminder.send24hReminders();
});

module.exports = job;

