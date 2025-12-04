const mp = new MercadoPago("PUBLIC_KEY", {
  locale: "es-AR",
});

async function pay() {
  const res = await fetch("/payments/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      appointmentId,
      title,
      price,
    }),
  });

  const data = await res.json();

  mp.checkout({
    preference: { id: data.id },
    autoOpen: true,
  });
}