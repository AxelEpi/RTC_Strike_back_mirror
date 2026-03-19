const ServerMembers = require("../model/Server_members");
module.exports = async function bannedMiddleware(req, res, next) {
  try {
    const serverId = req.params?.id || req.params?.serverId;
    console.log("MIDDLEWARE serverId:", serverId, "userId:", req.user?.id);
    if (!serverId || !req.user?.id) return next();
    const model = new ServerMembers();
    const roleRow = await model.getRoleForUser(serverId, req.user.id);
    console.log("MIDDLEWARE roleRow:", roleRow);
    if (roleRow?.role === "BANNED") {
      return res.status(403).json({ error: "Banned from server" });
    }
    return next();
  } catch (err) {
    console.error("MIDDLEWARE ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
};