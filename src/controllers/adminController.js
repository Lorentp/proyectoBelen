const Appointment = require("../models/Appointment");
const Service = require("../models/Service");
const moment = require("moment");
moment.locale("es");

const ADMIN_PASS = process.env.ADMIN_PASS || "1234";

module.exports = {
  // Dashboard
  getDashboard(req, res) {
    res.render("admin/dashboard", { title: "Panel Admin" });
  },

  // --------------------------
  // SERVICES CRUD
  // --------------------------
  async getServices(req, res) {
    try {
      const services = await Service.find().sort({ name: 1 }).lean();
      res.render("admin/services", { services, title: "Servicios" });
    } catch (err) {
      console.error("getServices:", err);
      res.status(500).send("Error al cargar servicios");
    }
  },

  async createService(req, res) {
    try {
      const { name, description, duration, price } = req.body;
      await Service.create({ name, description, duration, price });
      const pass = req.query.pass || req.body.pass || ADMIN_PASS;
      res.redirect(`/admin/services?pass=${pass}`);
    } catch (err) {
      console.error("createService:", err);
      res.status(500).send("Error al crear servicio");
    }
  },

  async updateService(req, res) {
    try {
      const { name, description, duration, price } = req.body;
      await Service.findByIdAndUpdate(req.params.id, { name, description, duration, price });
      const pass = req.query.pass || req.body.pass || ADMIN_PASS;
      res.redirect(`/admin/services?pass=${pass}`);
    } catch (err) {
      console.error("updateService:", err);
      res.status(500).send("Error al actualizar servicio");
    }
  },

  async deleteService(req, res) {
    try {
      await Service.findByIdAndDelete(req.params.id);
      const pass = req.query.pass || req.body.pass || ADMIN_PASS;
      res.redirect(`/admin/services?pass=${pass}`);
    } catch (err) {
      console.error("deleteService:", err);
      res.status(500).send("Error al eliminar servicio");
    }
  },

  // --------------------------
  // WEEKLY APPOINTMENTS (calendar)
  // --------------------------
  async getWeekAppointments(req, res) {
    try {
      // Accept ?week=YYYY-MM-DD (any date within week) or nothing -> current week
      const weekParam = req.query.week;
      let baseDate;

      if (weekParam) {
        // parse strictly expecting YYYY-MM-DD
        const m = moment(weekParam, "YYYY-MM-DD", true);
        baseDate = m.isValid() ? m : moment();
      } else {
        baseDate = moment();
      }

      // Use ISO week (week starts Monday)
      const startOfWeek = moment(baseDate).startOf("isoWeek");
      const endOfWeek = moment(startOfWeek).endOf("isoWeek");

      // Query appointments between start and end (inclusive)
      const appointments = await Appointment.find({
        date: {
          $gte: startOfWeek.format("YYYY-MM-DD"),
          $lte: endOfWeek.format("YYYY-MM-DD")
        }
      }).sort({ date: 1, time: 1 }).lean();

      // Build days array (Mon..Sun)
      const days = [];
      for (let i = 0; i < 7; i++) {
        const d = moment(startOfWeek).add(i, "days");
        days.push({
          date: d.format("YYYY-MM-DD"),
          label: d.format("dddd DD/MM"),
          items: appointments.filter(a => a.date === d.format("YYYY-MM-DD"))
        });
      }

      // prev/next week links (use an ISO-week date string)
      const prevWeek = moment(startOfWeek).subtract(7, "days").format("YYYY-MM-DD");
      const nextWeek = moment(startOfWeek).add(7, "days").format("YYYY-MM-DD");
      const pass = req.query.pass || ADMIN_PASS;

      res.render("admin/appointmentsWeek", {
        days,
        currentWeek: startOfWeek.format("YYYY-MM-DD"),
        prevWeek,
        nextWeek,
        pass,
        title: "Turnos - Semana"
      });
    } catch (err) {
      console.error("getWeekAppointments:", err);
      res.status(500).send("Error al cargar turnos semanales");
    }
  },

  async updateAppointmentFromWeek(req, res) {
    try {
      const { name, phone, service, date, time, status } = req.body;
      await Appointment.findByIdAndUpdate(req.params.id, { name, phone, service, date, time, status });

      // After update redirect to the week of the updated date
      const weekStart = moment(date, "YYYY-MM-DD", true).isValid()
        ? moment(date).startOf("isoWeek").format("YYYY-MM-DD")
        : moment().startOf("isoWeek").format("YYYY-MM-DD");

      const pass = req.query.pass || req.body.pass || ADMIN_PASS;
      res.redirect(`/admin/appointments-week?pass=${pass}&week=${weekStart}`);
    } catch (err) {
      console.error("updateAppointmentFromWeek:", err);
      res.status(500).send("Error al actualizar turno");
    }
  },

  async deleteAppointmentFromWeek(req, res) {
    try {
      const appt = await Appointment.findById(req.params.id).lean();
      if (!appt) return res.status(404).send("Turno no encontrado");

      await Appointment.findByIdAndDelete(req.params.id);

      const weekStart = moment(appt.date, "YYYY-MM-DD", true).isValid()
        ? moment(appt.date).startOf("isoWeek").format("YYYY-MM-DD")
        : moment().startOf("isoWeek").format("YYYY-MM-DD");

      const pass = req.query.pass || req.body.pass || ADMIN_PASS;
      res.redirect(`/admin/appointments-week?pass=${pass}&week=${weekStart}`);
    } catch (err) {
      console.error("deleteAppointmentFromWeek:", err);
      res.status(500).send("Error al eliminar turno");
    }
  },

  // API: get one appointment (for editor)
  async getAppointmentById(req, res) {
    try {
      const appt = await Appointment.findById(req.params.id).lean();
      if (!appt) return res.status(404).json({ error: "Turno no encontrado" });
      res.json(appt);
    } catch (err) {
      console.error("getAppointmentById:", err);
      res.status(500).json({ error: "Error al obtener turno" });
    }
  }
};
