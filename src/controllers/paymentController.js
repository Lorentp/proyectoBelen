const { MercadoPagoConfig, Preference } = require("mercadopago");
require("dotenv").config();

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

exports.createPreference = async (req, res) => {
  try {
    const { appointmentId, title, price } = req.body;

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
        success: `${process.env.BASE_URL}/payments/success`,
        failure: `${process.env.BASE_URL}/payments/failure`,
        pending: `${process.env.BASE_URL}/payments/pending`,
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
