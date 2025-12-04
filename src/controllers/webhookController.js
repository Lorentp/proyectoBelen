const Appointment = require("../models/Appointment");

module.exports = {
  async handleMercadoPagoWebhook(req, res) {
    try {
      const data = req.body;

      if (data.type === "payment") {
        const paymentId = data.data.id;

        const resp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`
          }
        });

        const paymentInfo = await resp.json();

        if (paymentInfo.status === "approved") {
          const appointmentId = paymentInfo.external_reference;

          await Appointment.findByIdAndUpdate(appointmentId, {
            status: "confirmed"
          });
        }
      }

      res.status(200).send("OK");
    } catch (error) {
      console.error("Error processing MP webhook:", error);
      res.status(500).send("Internal Server Error");
    }
  }
};