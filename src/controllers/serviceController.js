const Service = require("../models/Service");

module.exports = {
  async getAllServices(req, res) {
    try {
      const services = await Service.find().lean();
      res.render("services/list", { services });
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).send("Internal Server Error");
    }
  },

  async getServiceById(req, res) {
    try {
      const service = await Service.findById(req.params.id).lean();
      if (!service) return res.status(404).send("Service not found");

      res.render("services/detail", { service });
    } catch (error) {
      console.error("Error fetching service:", error);
      res.status(500).send("Internal Server Error");
    }
  },

  async createService(req, res) {
    try {
      await Service.create(req.body);
      res.redirect("/services");
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(500).send("Internal Server Error");
    }
  }
};