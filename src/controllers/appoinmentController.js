const Appointment = require("../models/Appointment");
const Service = require("../models/Service");
const { MercadoPagoConfig, Preference } = require("mercadopago");
const whatsapp = require("./whatsappController");
const BlockedSlot = require("../models/BlockedSlot");
const moment = require("moment");

moment.locale("es");

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

const buildBaseUrl = (req) => {
  const proto = req.get("x-forwarded-proto") || req.protocol;
  return process.env.BASE_URL || `${proto}://${req.get("host")}`;
};

function timeToMinutes(hhmm) {
  const [h, m] = String(hhmm || "").split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function minutesToTime(totalMinutes) {
  const h = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const m = String(totalMinutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

async function isSlotFree({ date, start, requiredMinutes }) {
  const STEP = 30;
  const startMin = timeToMinutes(start);
  if (startMin === null) return false;
  const endMin = startMin + requiredMinutes;

  const blocks = await BlockedSlot.find({ date }).lean();
  const blockedIntervals = blocks
    .map(b => {
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);
      if (bStart === null || bEnd === null) return null;
      return { start: bStart, end: bEnd };
    })
    .filter(Boolean);

  if (blockedIntervals.some(b => overlaps(startMin, endMin, b.start, b.end))) return false;

  const taken = await Appointment.find({ date }).lean();
  return !taken.some(a => {
    const aStart = timeToMinutes(a.time);
    const dur = Number(a.durationMinutes || 60);
    const durAligned = Math.ceil(dur / STEP) * STEP;
    if (aStart === null) return false;
    const aEnd = aStart + durAligned;
    return overlaps(startMin, endMin, aStart, aEnd);
  });
}

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
      const { date, serviceId } = req.query;

      if (!date) return res.status(400).json({ error: "Falta fecha" });

      // 07:00 a 21:00 cada 30 minutos
      const OPEN_MIN = 7 * 60;
      const CLOSE_MIN = 21 * 60;
      const STEP = 30;

      let durationMinutes = 30;
      if (serviceId) {
        const svc = await Service.findById(serviceId).lean();
        if (svc?.duration) durationMinutes = Number(svc.duration);
      }
      if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) durationMinutes = 30;

      // Alinea a múltiplos de 30 (si el servicio dura 45, bloquea 60)
      const requiredMinutes = Math.ceil(durationMinutes / STEP) * STEP;

      const taken = await Appointment.find({ date }).lean();
      const takenIntervals = taken
        .map(a => {
          const start = timeToMinutes(a.time);
          const dur = Number(a.durationMinutes || 60);
          const durAligned = Math.ceil(dur / STEP) * STEP;
          if (start === null) return null;
          return { start, end: start + durAligned };
        })
        .filter(Boolean);

      const blocks = await BlockedSlot.find({ date }).lean();
      const blockedIntervals = blocks
        .map(b => {
          const start = timeToMinutes(b.startTime);
          const end = timeToMinutes(b.endTime);
          if (start === null || end === null) return null;
          return { start, end };
        })
        .filter(Boolean);

      const candidates = [];
      for (let start = OPEN_MIN; start + requiredMinutes <= CLOSE_MIN; start += STEP) {
        const end = start + requiredMinutes;
        const conflict =
          takenIntervals.some(t => overlaps(start, end, t.start, t.end)) ||
          blockedIntervals.some(b => overlaps(start, end, b.start, b.end));
        if (!conflict) candidates.push(minutesToTime(start));
      }

      return res.json(candidates);
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
      const durationMinutes = serviceDoc?.duration ? Number(serviceDoc.duration) : 30;
      const STEP = 30;
      const requiredMinutes = Math.ceil((Number.isFinite(durationMinutes) ? durationMinutes : 30) / STEP) * STEP;

      // Validación de horario (07:00 a 21:00)
      const OPEN_MIN = 7 * 60;
      const CLOSE_MIN = 21 * 60;
      const startMin = timeToMinutes(time);
      if (startMin === null) return res.status(400).send("Horario inválido.");
      if (startMin < OPEN_MIN || startMin + requiredMinutes > CLOSE_MIN) {
        return res.status(400).send("Horario fuera del rango permitido.");
      }

      const free = await isSlotFree({ date, start: time, requiredMinutes });
      if (!free) return res.status(409).send("Ese horario ya no está disponible. Elegí otro.");

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
            success: `${baseUrl}/appointments/payment-success?name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}&service=${encodeURIComponent(serviceName)}&serviceId=${encodeURIComponent(serviceId || "")}&duration=${encodeURIComponent(String(durationMinutes || 30))}&date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}`,
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
      const { name, phone, service, serviceId, duration, date, time, payment_id, status } = req.query;

      const STEP = 30;
      const durationMinutes = Math.ceil((Number(duration) || 30) / STEP) * STEP;

      // Por seguridad, revalidamos disponibilidad antes de guardar
      const free = await isSlotFree({ date, start: time, requiredMinutes: durationMinutes });
      if (!free) {
        return res.render("appointments/paymentFailed", {
          title: "Turno no disponible",
          message: "El turno ya fue tomado por otra persona. Contactanos para reprogramar."
        });
      }

      // guardar turno
      const appt = await Appointment.create({
        name,
        phone,
        service,
        serviceId: serviceId || null,
        date,
        time,
        durationMinutes,
        paymentStatus: status || "approved",
        mpPaymentId: payment_id ? String(payment_id) : ""
      });

      // enviar WhatsApp
      const message = `Hola ${name}! Tu turno de ${service} fue confirmado para el ${date} a las ${time}.`;

      const digits = String(phone || "").replace(/\D/g, "");
      // AR default: if user didn't include country code, assume +54 9
      const phoneToSend = digits.startsWith("54") ? `+${digits}` : `+549${digits}`;
      const whatsappOk = await whatsapp.sendMessage(phoneToSend, message);

      res.render("appointments/paymentSuccess", {
        name, service, date, time,
        whatsappOk,
        whatsappMessage: message,
        title: "Turno confirmado"
      });
    } catch (err) {
      console.error(err);
      res.send("Error al confirmar turno.");
    }
  }
};
