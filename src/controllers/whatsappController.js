const axios = require("axios");

// TextMeBot WhatsApp API
// Required env:
// - TEXTMEBOT_API_KEY
// Optional env:
// - TEXTMEBOT_BASE_URL (default: https://api.textmebot.com)

module.exports = {
  async sendMessage(phone, message) {
    try {
      const apiKey = process.env.TEXTMEBOT_API_KEY;
      if (!apiKey) throw new Error("TEXTMEBOT_API_KEY missing");

      const baseUrl = (process.env.TEXTMEBOT_BASE_URL || "https://api.textmebot.com").replace(/\/+$/, "");
      const recipientRaw = (phone || "").trim();

      // TextMeBot typically expects only digits (e.g. 54911XXXXXXXX), without '+', spaces, dashes, etc.
      const normalizedRecipient = recipientRaw.replace(/\D/g, "");
      if (!normalizedRecipient) throw new Error("Recipient phone is empty/invalid");

      const params = {
        recipient: normalizedRecipient,
        apikey: apiKey,
        text: message
      };

      const resp = await axios.get(`${baseUrl}/send.php`, { params });

      // TextMeBot responses vary; treat HTTP 2xx as success unless it clearly indicates error.
      const body = resp?.data;
      if (typeof body === "string" && /error|invalid|denied/i.test(body)) {
        throw new Error(body);
      }

      return true;
    } catch (error) {
      console.error("Error sending WhatsApp message:", error.response?.data || error.message);
      return false;
    }
  }
};
