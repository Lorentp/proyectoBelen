const cron = require("node-cron");
const reminder = require("../controllers/reminderController");

// Corre todos los días a las 09:00 AM
// Formato cron:  ────────────>  min hora día-mes mes día-semana
const job = cron.schedule("0 9 * * *", async () => {
  console.log("Ejecutando recordatorio diario...");
  await reminder.sendDailyReminders();
});

module.exports = job;