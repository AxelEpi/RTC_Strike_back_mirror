// CONTROLLER
const channelModel = require("../model/Channel");
const v = require("../lib/validators");

class ChannelController {
  constructor() {
    this.model = new channelModel();
  }

  getAll = async (req, res) => {
    try {
      if (v.isUUID(req.params.serverId) === false) {
        throw new Error("Invalid server ID");
      }
      const getAlled = await this.model.getAll(req.params.serverId);
      res.json(getAlled);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  getById = async (req, res) => {
    try {
      if (v.isUUID(req.params.id) === false) {
        throw new Error("Invalid channel ID");
      }
      const getByIded = await this.model.getById(req.params.id);
      if (!getByIded) return res.status(404).json({ error: "Not find" });
      res.json(getByIded);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  create = async (req, res) => {
    try {
      const { name } = req.body;
      if (!v.isText(name)) {
        throw new Error("Invalid channel name");
      }
      if (!v.isUUID(req.params.serverId)) {
        throw new Error("Invalid server ID");
      }
      const created = await this.model.create(req.params.serverId, name);
      res.status(201).json(created);
    } catch (err) {
      console.error(err); // To see the complete error

      // Check if it's a duplicate error
      if (err.code === "23505") {
        return res
          .status(409)
          .json({ error: "This channel name is already in use" });
      }
      res.status(500).json({ error: "Unable to create channel" });
    }
  };

  update = async (req, res) => {
    try {
      if (!v.isUUID(req.params.id)) {
        throw new Error("Invalid channel ID");
      }
      if (!v.isText(req.body.name)) {
        throw new Error("Invalid channel name");
      }
      const updated = await this.model.update(req.params.id, req.body.name);
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  delete = async (req, res) => {
    try {
      if (!v.isUUID(req.params.id)) {
        throw new Error("Invalid channel ID");
      }
      const deleted = await this.model.delete(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Not found" });
      return res.status(200).json(deleted);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
}

module.exports = ChannelController;
