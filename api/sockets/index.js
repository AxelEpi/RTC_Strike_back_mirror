const WebSocket = require("ws");
const { mongoose, pool } = require("../config/database.js");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");
require("dotenv").config();

const KEY_JWT = process.env.JWT_SECRET;

const {
  addClient,
  welcome,
  notifyUserJoin,
  handleMessage,
  handleDisconnect,
  clients,
  handleTyping,
  broadcast,
} = require("../services/message.service");
const Presence = require("../model/Presence.js");
const Message = require("../model/message.js");
const Typing = require("../model/Typing.js");

/**
 * Initialise le serveur WebSocket
 * @param {http.Server} server - Le serveur HTTP Express
 * @returns {WebSocket.Server} - L'instance du serveur WebSocket
 */
module.exports = (server) => {
  // Créer le serveur WebSocket attaché au serveur HTTP
  const wss = new WebSocket.Server({ server });

  // Gérer les connexions WebSocket
  wss.on("connection", async (ws, req) => {
    console.log("Nouveau client arrive");

    let user = null;
    let channelId = null;
    let serverId = null;

    try {
      // Extraire le token depuis les cookies ou query string
      const cookies = cookie.parse(req.headers.cookie || "");
      const token =
        cookies.auth_token ||
        new URL(req.url, "ws://localhost").searchParams.get("token");

      if (!token) {
        ws.send(
          JSON.stringify({ type: "error", message: "Authentication required" }),
        );
        ws.close();
        return;
      }

      // Vérifier le JWT
      const decoded = jwt.verify(token, KEY_JWT);
      const userId = decoded.id;

      // Récupérer channelId depuis query string
      channelId =
        new URL(req.url, "ws://localhost").searchParams.get("channelId") ||
        "general";

      // Récupérer les infos utilisateur via le model User (comme /me)
      const UserModel = require("../model/User");
      const userModel = new UserModel();
      user = await userModel.getById(userId);

      if (!user) {
        ws.send(JSON.stringify({ type: "error", message: "User not found" }));
        ws.close();
        return;
      }

      // Récupérer le rôle de l'utilisateur dans le serveur (si channelId fourni)
      if (channelId && channelId !== "general") {
        // Vérifier le format UUID pour éviter un crash PostgreSQL
        if (!/^[0-9a-fA-F-]{36}$/.test(channelId)) {
          ws.send(
            JSON.stringify({ type: "error", message: "Invalid Channel ID" }),
          );
          ws.close();
          return;
        }

        const channelResult = await pool.query(
          "SELECT server_id FROM channels WHERE id = $1",
          [channelId],
        );

        if (channelResult.rows[0]) {
          serverId = channelResult.rows[0].server_id;
          const roleResult = await pool.query(
            "SELECT role FROM server_members WHERE server_id = $1 AND user_id = $2",
            [serverId, userId],
          );

          if (!roleResult.rows[0]) {
            ws.send(
              JSON.stringify({
                type: "error",
                message: "Access denied: You are not a member of this server.",
              }),
            );
            ws.close();
            return;
          }
          user.role = roleResult.rows[0].role;
        } else {
          ws.send(
            JSON.stringify({ type: "error", message: "Channel not found" }),
          );
          ws.close();
          return;
        }
      }

      console.log(`✅ User authenticated: ${user.username} (${user.id})`);

      welcome(ws, user, clients.size);
      addClient(user.id, ws, channelId, user);

      if (serverId) {
        const serverDescResult = await pool.query(
          "SELECT description FROM servers WHERE id = $1",
          [serverId]
        );
        
        ws.send(JSON.stringify({
          type: "channel_info",
          description: serverDescResult.rows[0]?.description || "Aucune description",
          serverId: serverId,
          channelId: channelId
        }));
      }

      // Enregistrer la présence en ligne
      await new Presence({
        userId: user.id.toString(),
        serverId: serverId || "general",
        status: "online",
      }).save();

      // Récupérer l'historique des messages pour ce channel
      const history = await Message.find({
        channelId: channelId,
        deleted: false,
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      // Enrichir l'historique avec les infos utilisateur de Postgres
      const enrichedHistory = await Promise.all(
        history.map(async (msg) => {
          const userInfo = await pool.query(
            "SELECT username FROM users WHERE id = $1",
            [msg.userId],
          );
          return {
            ...msg,
            username: userInfo.rows[0]?.username || "Unknown",
          };
        }),
      );

      console.log(
        `📜 ${enrichedHistory.length} messages chargés pour ${user.username}`,
      );

      // Récupérer les statuts de frappe pour ce channel
      const typers = await Typing.find({
        channelId: channelId,
        isTyping: true,
      }).lean();

      // Envoyer l'historique des messages et les statuts de frappe au client
      ws.send(
        JSON.stringify({
          type: "history",
          history: enrichedHistory.reverse(),
          typingUsers: typers.map((t) => t.userId),
          user: user, // Envoyer les infos du user connecté
        }),
      );

      console.log(`✅ Client connecté: ${user.username}`);
      // Notifier les autres utilisateurs du même channel
      notifyUserJoin(user, channelId, ws);
    } catch (err) {
      console.error("❌ Erreur authentification:", err.message);
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Authentication failed: " + err.message,
        }),
      );
      ws.close();
      return;
    }

    // Gérer les messages entrants
    ws.on("message", async (data) => {
      handleMessage(data, user, ws, channelId);
    });

    // Gérer la déconnexion du client
    ws.on("close", async () => {
      console.log(`❌ Client déconnecté: ${user?.username}`);

      if (user) {
        try {
          // Mettre à jour la présence en ligne
          await Presence.findOneAndUpdate(
            { userId: user.id.toString() },
            { status: "offline", lastSeen: new Date() },
            { upsert: true, new: true },
          );
        } catch (err) {
          console.error("Erreur lors de la mise à jour de la présence:", err);
        }

        handleDisconnect(user.id, channelId);
      }
    });
  });

  console.log("✅ WebSocket server initialized and attached to HTTP server");

  return wss;
};
