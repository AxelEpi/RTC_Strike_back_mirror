// services/JointurePostMongo.js - VERSION SIMPLIFIÉE
const Server_members = require("../model/Server_members");
const Channel = require("../model/Channel");
const Message = require("../model/message");
const { pool } = require("../config/database");

const serverMembers = new Server_members();
const channels = new Channel();

// ⚡ SEND MESSAGE - SANS VÉRIFICATIONS
async function sendMessage(serverId, channelId, userId, content) {
  // 1. Sauvegarder MongoDB
  const message = new Message({
    channelId,
    serverId,
    userId,
    content,
    deleted: false,
    edited: false,
  });
  const saved = await message.save();

  // 2. Enrichir username/role (ENCORE utile !)
  const userData = await serverMembers.getUsernamesByIds(serverId, [userId]);
  const username = userData[userId]?.username || `User ${userId.slice(-4)}`;

  return {
    _id: saved._id,
    userId,
    content,
    createdAt: saved.createdAt,
    username,
    role: userData[userId]?.role || "MEMBER",
  };
}

// ⚡ GET MESSAGES - SANS VÉRIFICATIONS
async function getMessages(serverId, channelId, limit = 50) {
  const messages = await Message.find({
    serverId: serverId.toString(),
    channelId: channelId.toString(),
    deleted: false,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  console.log(
    "🐛 RAW MongoDB messages (sans username):",
    messages.map((m) => ({
      userId: m.userId,
      content: m.content.slice(0, 20),
    })),
  );

  const enriched = await enrichMessages(
    serverId,
    channelId,
    messages.reverse(),
  );
  console.log(
    "🐛 ENRICHED messages (avec username):",
    enriched.map((m) => ({ userId: m.userId, username: m.username })),
  );

  return enriched;
}

// Enrichir usernames
async function getUsernamesByIds(serverId, userIds) {
  if (!userIds.length) return {};

  try {
    const idsArray = Array.isArray(userIds) ? userIds : [userIds];

    const result = await pool.query(
      `SELECT sm.user_id, u.username, sm.role
       FROM server_members sm
       JOIN users u ON sm.user_id = u.id
       WHERE sm.server_id = $1 AND sm.user_id = ANY($2::uuid[])`,
      [serverId, idsArray],
    );

    const userMap = {};
    result.rows.forEach((row) => {
      userMap[row.user_id] = {
        username: row.username,
        role: row.role || "MEMBER",
      };
    });

    return userMap;
  } catch (e) {
    console.error("Erreur usernames:", e.message);
    return {};
  }
}

// Enrichir les messages avec username/role uniquement si nécessaire
async function enrichMessages(serverId, channelId, messages) {
  if (!messages.length) return [];

  // 1️⃣ Identifier les userIds manquants (messages sans username)
  const userIdsToFetch = [
    ...new Set(
      messages
        .filter((msg) => !msg.username) // seulement ceux sans username
        .map((msg) => msg.userId)
        .filter(Boolean),
    ),
  ];

  console.log("🔍 userIds à enrichir:", userIdsToFetch);

  let userMap = {};
  if (userIdsToFetch.length) {
    userMap = await getUsernamesByIds(serverId, userIdsToFetch);
  }

  // 2️⃣ Enrichir les messages
  const enriched = messages.map((msg) => {
    // garder l'ancien username si déjà présent
    const username =
      msg.username ||
      userMap[msg.userId]?.username ||
      `User ${msg.userId?.slice(-4)}`;
    const role = msg.role || userMap[msg.userId]?.role || "MEMBER";

    return { ...msg, username, role };
  });

  return enriched;
}

async function deleteMessage(serverId, channelId, messageId, userId) {
  const message = await Message.findOneAndUpdate(
    { _id: messageId, userId, serverId, channelId, deleted: false },
    { deleted: true },
    { new: true },
  );

  if (!message) {
    const error = new Error("Message introuvable ou accès refusé");
    error.code = "NOT_FOUND";
    throw error;
  }

  return { messageId: message._id };
}

module.exports = { sendMessage, getMessages, enrichMessages, deleteMessage };
