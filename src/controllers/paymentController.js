const { MercadoPagoConfig, Preference } = require("mercadopago");
require("dotenv").config();

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const getBaseUrl = (req) => {
  const proto = req.get("x-forwarded-proto") || req.protocol;
  return process.env.BASE_URL || `${proto}://${req.get("host")}`;
};

exports.createPreference = async (req, res) => {
  try {
    const { appointmentId, title, price } = req.body;
    const baseUrl = getBaseUrl(req);

    const body = {
      items: [
        {
          id: appointmentId,
          title,
          quantity: 1,
          unit_price: Number(price),
          currency_id: "ARS",
        },
      ],
      back_urls: {
        success: `${baseUrl}/payments/success`,
        failure: `${baseUrl}/payments/failure`,
        pending: `${baseUrl}/payments/pending`,
      },
      auto_return: "approved",
    };

    const preference = new Preference(client);
    const response = await preference.create({ body });

    res.json({ id: response.id });
  } catch (error) {
    console.error("Error creando preferencia:", error);
    res.status(500).json({ error: "Error creando preferencia" });
  }
};

exports.paymentSuccess = (req, res) => {
  res.render("payments/success", {
    title: "Pago aprobado",
  });
};

exports.paymentFailure = (req, res) => {
  res.render("payments/failure", {
    title: "Pago rechazado",
  });
};

exports.paymentPending = (req, res) => {
  res.render("payments/pending", {
    title: "Pago pendiente",
  });
};
