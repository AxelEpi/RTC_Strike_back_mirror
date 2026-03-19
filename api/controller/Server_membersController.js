const server_membersModel = require("../model/Server_members");
const v = require("../lib/validators");

class Server_membersController {
  constructor() {
    this.model = new server_membersModel();// Instanciation du modèle pour pouvoir l'utiliser dans les méthodes du contrôleur
  }
  // Récupère les membres du serveur pour l'utilisateur connecté
  getByIdUser = async (req, res) => {
    try {
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
  // Récupère tous les membres d'un serveur
  getAll = async (req, res) => {
    try {
      if (!v.isUUID(req.params.id)) {
        throw new Error("Invalid server ID");
      }
      const getAlled = await this.model.getAll(req.params.id);
      res.json(getAlled);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  // Récupère le rôle de l'utilisateur connecté dans un serveur
  getMyRole = async (req, res) => {
    try {
      if (!v.isUUID(req.params.id)) {
        throw new Error("Invalid server ID");
      }
      if (!v.isUUID(req.user.id)) {
        throw new Error("Invalid user ID");
      }
      const roleRow = await this.model.getRoleForUser(
        req.params.id,
        req.user.id,
      );
      if (!roleRow) return res.status(404).json({ error: "Not found" });
      res.json({ role: roleRow.role });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  // Récupère les informations d'un membre spécifique d'un serveur
  getById = async (req, res) => {
    try {
      if (!v.isUUID(req.params.id)) {
        throw new Error("Invalid server member ID");
      }
      const getByIded = await this.model.getById(req.params.id);
      if (!getByIded) return res.status(404).json({ error: "Not found" });
      res.json(getByIded);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  // Récupère la liste des utilisateurs bannis d'un serveur
  getBannedUsers = async (req, res) => {
    try {
      if (!v.isUUID(req.params.id)) {
        throw new Error("Invalid server ID");
      }
      const bannedUsers = await this.model.getBannedUsers(req.params.id);
      res.json(bannedUsers);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  // Ajoute un utilisateur au serveur (l'utilisateur connecté ou un autre utilisateur spécifié)
  create = async (req, res) => {
    try {
      if (!v.isUUID(req.params.id)) {
        throw new Error("Invalid server ID");
      }

      const userId = req.body?.user_id || req.user?.id;
      if (!v.isUUID(userId)) {
        throw new Error("Invalid user ID");
      }

      const created = await this.model.create(req.params.id, userId);
      res.status(201).json(created);
    } catch (err) {
      console.error(err); // To see the complete error
      res.status(500).json({ error: "Unable to create server member" });
    }
  };
  // Met à jour le rôle d'un membre du serveur
  update = async (req, res) => {
    try {
      if (!v.isUUID(req.params.id)) {
        throw new Error("Invalid server ID");
      }
      if (!v.isUUID(req.params.userId)) {
        throw new Error("Invalid user ID");
      }
      if (!v.isText(req.body.role)) {
        throw new Error("Invalid role");
      }
      const { role } = req.body;
      const updated = await this.model.update(
        req.params.id,
        req.params.userId,
        role,
      );
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  // Supprime un membre du serveur (l'utilisateur connecté ou un autre utilisateur spécifié)
  delete = async (req, res) => {
    try {
      if (!v.isUUID(req.params.id)) {
        throw new Error("Invalid server member ID");
      }
      if (!v.isUUID(req.user.id)) {
        throw new Error("Invalid user ID");
      }
      console.log(req.params.id, req.user.id);
      const deleted = await this.model.delete(req.params.id, req.user.id);
      if (!deleted) return res.status(404).json({ error: "Not found" });
      res.json(deleted);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  // Supprime un membre du serveur (utilisé pour expulser un utilisateur spécifique)
  kick = async (req, res) => {
    try {
      if (!v.isUUID(req.params.id)) {
        throw new Error("Invalid server ID");
      }
      if (!v.isUUID(req.params.userId)) {
        throw new Error("Invalid user ID");
      }
      const deleted = await this.model.delete(req.params.id, req.params.userId);
      if (!deleted) return res.status(404).json({ error: "Not found" });
      res.json(deleted);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  // Bannit un utilisateur d'un serveur, avec une durée optionnelle pour les bans temporaires
 ban = async (req, res) => {
  try {
    console.log("BAN params:", req.params);
    console.log("BAN body:", req.body);
    console.log("1. Validation...");
    if (!v.isUUID(req.params.id)) throw new Error("Invalid server ID");
    if (!v.isUUID(req.params.userId)) throw new Error("Invalid user ID");
    console.log("2. Calcul duration...");
    let bannedUntil = null;
    if (req.body.duration !== undefined) {
      if (!Number.isInteger(req.body.duration)) throw new Error("Invalid duration");
      const duration = parseInt(req.body.duration, 10);
      bannedUntil = new Date(Date.now() + duration * 1000);
    }
    console.log("3. bannedUntil:", bannedUntil);
    const updated = await this.model.ban(
      req.params.id,
      req.params.userId,
      bannedUntil,
    );
    console.log("4. updated:", updated);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (err) {
    console.error("BAN ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
// Déleste un utilisateur banni d'un serveur, le rendant à nouveau membre potentiel
unban = async (req, res) => {
  try {
    console.log("UNBAN params:", req.params);
    console.log("BAN body:", req.body);
    console.log("BAN user:", req.user);
    // Validation des IDs
    if (!v.isUUID(req.params.id)) {
      throw new Error("Invalid server ID");
    }
    // Validation de l'ID de l'utilisateur à débannir
    if (!v.isUUID(req.params.userId)) {
      throw new Error("Invalid user ID");
    }
    const updated = await this.model.unban(
      req.params.id,
      req.params.userId,
    );
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }}
};
module.exports = Server_membersController;
