const Appointment = require("../models/Appointment");
const Service = require("../models/Service");
const { MercadoPagoConfig, Preference } = require("mercadopago");
const whatsapp = require("./whatsappController");
const moment = require("moment");

moment.locale("es");

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

const buildBaseUrl = (req) => {
  const proto = req.get("x-forwarded-proto") || req.protocol;
  return process.env.BASE_URL || `${proto}://${req.get("host")}`;
};

module.exports = {

  // 1) Renderizar página para seleccionar servicio
  async getSelectService(req, res) {
    const services = await Service.find().sort({ name: 1 }).lean();
    res.render("appointments/selectService", { services, title: "Elegir servicio" });
  },

  // Vista legacy: reservar desde /appointments/book/:id
  async getBook(req, res) {
    try {
      const service = await Service.findById(req.params.id).lean();
      if (!service) return res.redirect("/services");

      res.render("appointments/book", {
        service,
        title: `Reservar ${service.name}`
      });
    } catch (err) {
      console.error("getBook:", err);
      res.redirect("/services");
    }
  },

  // 2) Render fecha según servicio elegido
  async getSelectDate(req, res) {
    const service = req.query.service;
    if (!service) return res.redirect("/appointments/select-service");

    res.render("appointments/selectDate", {
      service,
      title: "Elegir fecha"
    });
  },

  // 3) Obtener horarios disponibles sin importar el servicio
  async getAvailableSlots(req, res) {
    try {
      const { date } = req.query;

      if (!date) return res.status(400).json({ error: "Falta fecha" });

      // HORARIOS FIJOS CADA 1 HORA
      const schedule = [
        "09:00","10:00","11:00","12:00",
        "13:00","14:00","15:00","16:00","17:00"
      ];

      // Turnos ocupados SOLO por fecha
      const taken = await Appointment.find({ date }).lean();
      const takenTimes = taken.map(a => a.time);

      const available = schedule.filter(time => !takenTimes.includes(time));

      return res.json(available);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Error obteniendo horarios" });
    }
  },

  // 4) Renderizar formulario de datos del cliente
  async getFormData(req, res) {
    const { date, time, service } = req.query;

    if (!date || !time || !service) return res.redirect("/appointments/select-service");

    res.render("appointments/formData", {
      date,
      time,
      service,
      title: "Tus datos"
    });
  },

  // 5) Crear preferencia de pago MercadoPago
  async processPayment(req, res) {
    try {
      const { name, phone, serviceId, service: serviceNameForm, date, time } = req.body;

      if (!name || !phone || !date || !time) return res.status(400).send("Datos incompletos.");

      const serviceDoc = serviceId ? await Service.findById(serviceId).lean() : null;
      const serviceName = serviceNameForm || serviceDoc?.name || "Servicio";
      const price = serviceDoc?.price ? Number(serviceDoc.price) : 1000;
      const baseUrl = buildBaseUrl(req);

      const preference = new Preference(mpClient);
      const pref = await preference.create({
        body: {
          items: [
            {
              title: `Turno para ${serviceName}`,
              quantity: 1,
              unit_price: price,
              currency_id: "ARS"
            }
          ],
          back_urls: {
            success: `${baseUrl}/appointments/payment-success?name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}&service=${encodeURIComponent(serviceName)}&date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}`,
            failure: `${baseUrl}/appointments/payment-failed`,
            pending: `${baseUrl}/appointments/payment-failed`
          },
          auto_return: "approved",
          external_reference: `${phone}-${date}-${time}`
        }
      });

      const redirectUrl = pref.init_point || pref.sandbox_init_point;
      return res.redirect(redirectUrl);
    } catch (err) {
      console.error("processPayment:", err);
      return res.status(500).send("Error procesando el pago");
    }
  },

  // 6) Confirmación después del pago
  async paymentSuccess(req, res) {
    try {
      const { name, phone, service, date, time } = req.query;

      // guardar turno
      const appt = await Appointment.create({
        name,
        phone,
        service,
        date,
        time,
        paymentStatus: "approved"
      });

      // enviar WhatsApp
      const message = `Hola ${name}! Tu turno de ${service} fue confirmado para el ${date} a las ${time}.`;

      const phoneToSend = phone && phone.startsWith("+") ? phone : `+549${phone || ""}`;
      await whatsapp.sendMessage(phoneToSend, message);

      res.render("appointments/paymentSuccess", {
        name, service, date, time,
        title: "Turno confirmado"
      });
    } catch (err) {
      console.error(err);
      res.send("Error al confirmar turno.");
    }
  }
};
