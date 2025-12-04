const axios = require("axios");

// Env flags:
// WHATSAPP_PROVIDER=whatsapp_cloud | ultramsg (default whatsapp_cloud)
// For whatsapp_cloud: WHATSAPP_PHONE_ID, WHATSAPP_TOKEN
// For ultramsg: ULTRAMSG_INSTANCE, ULTRAMSG_TOKEN

module.exports = {
  async sendMessage(phone, message) {
    const provider = (process.env.WHATSAPP_PROVIDER || "whatsapp_cloud").toLowerCase();

    try {
      if (provider === "ultramsg") {
        const instance = process.env.ULTRAMSG_INSTANCE;
        const token = process.env.ULTRAMSG_TOKEN;
        if (!instance || !token) throw new Error("ULTRAMSG credentials missing");

        await axios.post(
          `https://api.ultramsg.com/${instance}/messages/chat`,
          { to: phone, body: message },
          { params: { token } }
        );
        return true;
      }

      // Default: WhatsApp Cloud API
      const phoneId = process.env.WHATSAPP_PHONE_ID;
      const token = process.env.WHATSAPP_TOKEN;
      if (!phoneId || !token) throw new Error("WhatsApp Cloud credentials missing");

      await axios.post(
        `https://graph.facebook.com/v19.0/${phoneId}/messages`,
        {
          messaging_product: "whatsapp",
          to: phone.replace(/\s+/g, ""),
          type: "text",
          text: { body: message }
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      return true;
    } catch (error) {
      console.error("Error sending WhatsApp message:", error.response?.data || error.message);
      return false;
    }
  }
};
