const app = require("./app");
const cron = require("./jobs/reminderCron");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("el gonzalo es alto autista");
});

// Inicia cron de recordatorios
cron.start();
