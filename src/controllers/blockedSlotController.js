const BlockedSlot = require("../models/BlockedSlot");

function timeToMinutes(hhmm) {
  const [h, m] = String(hhmm || "").split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

module.exports = {
  async getBlocks(req, res) {
    try {
      const date = req.query.date || "";
      const pass = req.query.pass;

      const query = date ? { date } : {};
      const blocks = await BlockedSlot.find(query).sort({ date: -1, startTime: 1 }).lean();

      res.render("admin/blocks", {
        title: "Bloqueos",
        blocks,
        date,
        pass
      });
    } catch (err) {
      console.error("getBlocks:", err);
      res.status(500).send("Error al cargar bloqueos");
    }
  },

  async createBlock(req, res) {
    try {
      const { date, startTime, endTime, reason } = req.body;
      if (!date || !startTime || !endTime) return res.status(400).send("Datos incompletos");

      const start = timeToMinutes(startTime);
      const end = timeToMinutes(endTime);
      if (start === null || end === null || start >= end) return res.status(400).send("Rango inválido");

      await BlockedSlot.create({
        date,
        startTime,
        endTime,
        reason: reason || ""
      });

      const pass = req.query.pass || req.body.pass;
      res.redirect(`/admin/blocks?pass=${pass}${date ? `&date=${date}` : ""}`);
    } catch (err) {
      console.error("createBlock:", err);
      res.status(500).send("Error al crear bloqueo");
    }
  },

  async deleteBlock(req, res) {
    try {
      await BlockedSlot.findByIdAndDelete(req.params.id);
      const pass = req.query.pass || req.body.pass;
      const date = req.query.date || "";
      res.redirect(`/admin/blocks?pass=${pass}${date ? `&date=${date}` : ""}`);
    } catch (err) {
      console.error("deleteBlock:", err);
      res.status(500).send("Error al eliminar bloqueo");
    }
  }
};

