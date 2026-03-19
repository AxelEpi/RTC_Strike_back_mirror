const serverModel = require("../model/Server");
const serverMembersModel = require("../model/Server_members");
const v = require("../lib/validators");

class ServerController {
  constructor() {
    this.model = new serverModel();
    this.membersModel = new serverMembersModel();
  }

  getByIdUser = async (req, res) => {
    try {
      // req.user vient du middleware auth
      if (!v.isUUID(req.user.id)) {
        throw new Error("Invalid user ID");
      }
      const userId = req.user.id;
      const getByIdUsered = await this.model.getByIdUser(userId);
      res.json(getByIdUsered);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  getAll = async (req, res) => {
    try {
      if (!v.isUUID(req.user.id)) {
        throw new Error("Invalid user ID");
      }
      const getAlled = await this.model.getAll(req.user.id);
      res.json(getAlled);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  getById = async (req, res) => {
    try {
      if (!v.isUUID(req.params.id)) {
        throw new Error("Invalid server ID");
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
      // Get user_id from authenticated user (from auth middleware)
      if (!v.isUUID(req.user.id)) {
        throw new Error("Invalid user ID");
      }
      if (!v.isText(req.body.name)) {
        throw new Error("Invalid server name");
      }
      // Description est optionnelle
      const description = req.body.description || null;
      const user_id = req.user.id;
      const { name } = req.body;
      const created = await this.model.create(user_id, name, description);
      await this.membersModel.create(created.id, user_id, "OWNER");
      res.status(201).json(created);
    } catch (err) {
      res.status(500).json({ error: "Unable to create server" });
    }
  };

  update = async (req, res) => {
    try {
      if (!v.isUUID(req.params.id)) {
        throw new Error("Invalid server ID");
      }
      if (!v.isText(req.body.name)) {
        throw new Error("Invalid server name");
      }
      // Description est optionnelle
      const description = req.body.description || null;
      const { name } = req.body;
      const updated = await this.model.update(req.params.id, name, description);
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  delete = async (req, res) => {
    try {
      if (!v.isUUID(req.params.id)) {
        throw new Error("Invalid server ID");
      }
      const deleted = await this.model.delete(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Not found" });
      res.json(deleted);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
}

module.exports = ServerController;
