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
      const recipient = (phone || "").replace(/\s+/g, "");

      // TextMeBot expects recipient usually without '+' (e.g. 54911XXXXXXXX)
      const normalizedRecipient = recipient.startsWith("+") ? recipient.slice(1) : recipient;

      const params = {
        recipient: normalizedRecipient,
        apikey: apiKey,
        text: message
      };

      const resp = await axios.get(`${baseUrl}/send.php`, { params });

      // TextMeBot responses vary; treat HTTP 2xx as success unless it clearly indicates error.
      if (resp?.data && typeof resp.data === "string" && /error|invalid|denied/i.test(resp.data)) {
        throw new Error(resp.data);
      }

      return true;
    } catch (error) {
      console.error("Error sending WhatsApp message:", error.response?.data || error.message);
      return false;
    }
  }
};
