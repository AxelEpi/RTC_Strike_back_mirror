// CONTROLLER
const InvitationModel = require("../model/Invitation");
const ServerMembersModel = require("../model/Server_members");
const { pool } = require("../config/database");
const crypto = require("crypto");
const v = require("../lib/validators");


class InvitationController {
  constructor() {
    this.model = new InvitationModel();
    this.serverMembersModel = new ServerMembersModel();
  }

  getAll = async (req, res) => {
  try {
    if (!v.isUUID(req.params.serverId)) {
      return res.status(400).json({ error: "Invalid server ID" });
    }
    
    const invites = await this.model.getAll(req.params.serverId);
    console.log('getAll result:', invites); // DEBUG
    
    //  FORCE tableau vide si null/undefined
    res.json(Array.isArray(invites) ? invites : []);
    
  } catch (err) {
    console.error('getAll ERROR:', err);
    res.status(500).json({ error: err.message });
  }
};


  getById = async (req, res) => {
    try {
      if (!v.isUUID(req.params.serverId)) {
        throw new Error("Invalid server ID");
      }
      if (!v.isUUID(req.user.id)) {
        throw new Error("Invalid user ID");
      }
      const getByIded = await this.model.getById(
        req.user.id,
        req.params.serverId,
      );
      if (!getByIded) return res.status(404).json({ error: "Not found" });
      res.json(getByIded);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  getByCode = async (req, res) => {
    try {
      const code = req.params.code;
      if (!code || !/^[A-F0-9]{8}$/i.test(code)) {
        throw new Error("Invalid invitation code");
      }
      const getByIded = await this.model.getByCode(req.params.code);
      if (!getByIded) return res.status(404).json({ error: "Not found" });
      res.json(getByIded);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  create = async (req, res) => {
  try {
    //  VALEURS PAR DÉFAUT (pas obligatoire)
    const max_uses = req.body.max_uses || 0;  // 0 = illimité
    const expires_date = req.body.expires_date || 7;  // 7 jours
    
    //  Validation seulement si fourni
    if (req.body.max_uses !== undefined && !v.isNumber(max_uses)) {
      return res.status(400).json({ error: "Invalid max uses" });
    }
    if (req.body.expires_date !== undefined && !v.isNumber(expires_date)) {
      return res.status(400).json({ error: "Invalid expires date" });
    }

    const uses = 0;
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    const expiresInDays = Number.isFinite(Number(expires_date))
      ? Number(expires_date)
      : 7;
    const expires_at = new Date(
      Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
    );
    
    console.log('Creating invite:', { code, max_uses, expiresInDays }); // DEBUG
    
    const created = await this.model.create(
      req.params.serverId,
      req.user.id,
      code,
      max_uses,
      uses,
      expires_at,
    );
    
    console.log('Invite created:', created); // DEBUG
    
    if (!created) {
      return res.status(500).json({ error: 'Database insert failed' });
    }
    
    res.status(201).json(created);
  } catch (err) {
    console.error('CREATE INVITE ERROR:', err); // DEBUG
    if (err.code === "23505") {
      return res.status(409).json({ error: "This invitation code is already in use" });
    }
    res.status(500).json({ error: "Unable to create invitation" });
  }
};


  delete = async (req, res) => {
    try {
      if (!v.isUUID(req.params.id)) {
        throw new Error("Invalid invitation ID");
      }
      const deleted = await this.model.delete(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Not found" });
      res.status(200).json(deleted);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
join = async (req, res) => {
  try {
    console.log("JOIN body:", req.body);
    console.log("JOIN user:", req.user);

    const { code } = req.body;
    const userId = req.user.id;

    if (!code || !/^[A-F0-9]{8}$/i.test(code)) {
      throw new Error("Invalid invitation code");
    }

    console.log("1. Recherche invitation...");
    const invitation = await this.model.getByCode(code);
    console.log("2. Invitation trouvee:", invitation);

    if (!invitation) {
      return res.status(404).json({ error: "Invalid invitation code" });
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return res.status(410).json({ error: "This invitation has expired" });
    }

    if (invitation.max_uses > 0 && invitation.uses >= invitation.max_uses) {
      return res.status(410).json({ error: "This invitation has reached its maximum uses" });
    }
    const existingMember = await this.serverMembersModel.getRoleForUser(invitation.server_id, userId);
    if (existingMember?.role === 'BANNED') {
      // Ban temporaire expiré : on remet MEMBER
      if (existingMember.banned_until && new Date(existingMember.banned_until) < new Date()) {
        await this.serverMembersModel.update(invitation.server_id, userId, 'MEMBER');
      } else {
        return res.status(403).json({ error: "Vous etes banni de ce serveur" });
      }
    }
    console.log("3. Ajout membre...");
    await this.serverMembersModel.create(invitation.server_id, userId, "MEMBER");
    console.log("4. Membre ajoute");

    console.log("5. Increment uses...");
    await pool.query("UPDATE invitations SET uses = uses + 1 WHERE id = $1", [invitation.id]);
    console.log("6. Uses incremente");

    res.json({ message: "Joined server successfully", server_id: invitation.server_id });
  } catch (err) {
    console.error("JOIN ERROR:", err);
    res.status(err.status || 500).json({ error: err.message });
  }
};
}
module.exports = InvitationController;
