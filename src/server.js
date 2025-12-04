const app = require('./app');
const cron = require('./jobs/reminderCron');


const PORT = process.env.PORT || 3000;


app.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
});


// Inicia cron de recordatorios
cron.start();