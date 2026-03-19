//module pour gérer les messages WebSocket
const WebSocket = require("ws");
const Message = require("../model/message");
const Typing = require("../model/Typing");
const Presence = require("../model/Presence");
const mongoose = require("mongoose");
const validator = require("../lib/validators");
const { pool } = require("../config/database");

const clients = new Map();
let typingTimeouts = new Map();
let wssInstance = null;

function addClient(userId, ws, channelId, user) {
  clients.set(userId, { ws, channelId, user });
}

function welcome(ws, user, totalClients) {
  const trueTotal = totalClients + 1;
  ws.send(
    JSON.stringify({
      type: "welcome",
      message: `Bienvenue ${user.username} ! Vous êtes connecté.`,
      user: user,
      totalClients: trueTotal,
    }),
  );
}

function notifyUserJoin(user, channelId, ws) {
  broadcast(
    {
      type: "system",
      subtype: "user_joined",
      message: `${user.username} a rejoint le chat (${clients.size} connectés)`,
      timestamp: Date.now(),
    },
    ws,
    channelId,
  );
}

async function handleMessage(data, user, ws, currentChannelId) {
  try {
    const msg = JSON.parse(data);
    const channelId = msg.channelId || currentChannelId;

    if (msg.type === "chat") {
      if (!validator.isText(msg.message || "")) {
        const error = new Error(
          "Message invalide: le contenu ne peut pas être vide",
        );
        error.code = "VALIDATION_ERROR";
        throw error;
      }

      let userRole = "MEMBER";
      let serverId = msg.serverId || "default";

      if (channelId && channelId !== "general") {
        const channelResult = await pool.query(
          "SELECT server_id FROM channels WHERE id = $1",
          [channelId],
        );

        if (channelResult.rows[0]) {
          serverId = channelResult.rows[0].server_id;
          const roleResult = await pool.query(
            "SELECT role FROM server_members WHERE server_id = $1 AND user_id = $2",
            [serverId, user.id],
          );

          if (!roleResult.rows[0]) {
            const error = new Error("Vous n'êtes pas membre de ce serveur");
            error.code = "PERMISSION_ERROR";
            throw error;
          }
          userRole = roleResult.rows[0].role;
        }
      }

      const savedMessage = await new Message({
        channelId: channelId,
        serverId: serverId,
        userId: user.id.toString(),
        content: msg.message,
        deleted: false,
      }).save();

      broadcast(
        {
          type: "message",
          _id: savedMessage._id,
          channelId: savedMessage.channelId,
          serverId: savedMessage.serverId,
          userId: user.id,
          username: user.username,
          role: userRole,
          content: savedMessage.content,
          createdAt: savedMessage.createdAt,
          timestamp: Date.now(),
        },
        null,
        channelId,
      );
    } else if (msg.type === "typing") {
      await Typing.findOneAndUpdate(
        { channelId: channelId, userId: user.id.toString() },
        {
          channelId: channelId,
          userId: user.id.toString(),
          isTyping: msg.isTyping,
        },
        { upsert: true, new: true },
      );
      handleTyping(user, msg.isTyping, ws, channelId);
    } else if (msg.type === "delete_message") {
      if (!msg.messageId) {
        const error = new Error("ID message manquant");
        error.code = "VALIDATION_ERROR";
        throw error;
      }

      const deletedMessage = await Message.findOneAndUpdate(
        {
          _id: msg.messageId,
          userId: user.id.toString(),
          deleted: false,
        },
        { deleted: true },
        { new: true },
      );

      if (!deletedMessage) {
        const error = new Error("Message introuvable ou déjà supprimé");
        error.code = "NOT_FOUND";
        throw error;
      }

      console.log("Message supprime:", msg.messageId);
      broadcast(
        {
          type: "delete",
          messageId: msg.messageId,
        },
        null,
        channelId,
      );
    } else if (msg.type === "edit_message") {
      if (!msg.messageId || !validator.isText(msg.newContent)) {
        const error = new Error("ID ou contenu invalide");
        error.code = "VALIDATION_ERROR";
        throw error;
      }

      const updatedMessage = await Message.findOneAndUpdate(
        {
          _id: msg.messageId,
          userId: user.id.toString(),
          deleted: false,
        },
        {
          content: msg.newContent,
          edited: true,
        },
        { new: true },
      );

      if (!updatedMessage) {
        const error = new Error("Message introuvable");
        error.code = "NOT_FOUND";
        throw error;
      }

      console.log("Message edite:", msg.messageId);
      broadcast(
        {
          type: "edit",
          _id: updatedMessage._id.toString(),
          messageId: updatedMessage._id.toString(),
          content: updatedMessage.content,
          edited: true,
          editedAt: updatedMessage.updatedAt,
        },
        null,
        channelId,
      );
    }
  } catch (e) {
    if (e.code === "VALIDATION_ERROR" || e.code === "PERMISSION_ERROR") {
      console.error("Erreur:", e.message);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "error",
            message: e.message,
            code: e.code,
          }),
        );
      }
    } else {
      console.error("Erreur handleMessage:", e);
    }
  }
}

function handleDisconnect(userId, channelId) {
  const clientData = clients.get(userId);
  if (clientData) {
    const username = clientData.user?.username || "Un utilisateur";
    clients.delete(userId);
    broadcast(
      {
        type: "system",
        subtype: "user_left",
        message: `${username} a quitté (${clients.size} connectés)`,
        timestamp: Date.now(),
      },
      null,
      channelId,
    );
  }
}

function handleTyping(user, isTyping, excludeWs, channelId) {
  const userId = user.id;

  if (typingTimeouts.has(userId)) {
    clearTimeout(typingTimeouts.get(userId));
  }

  if (isTyping) {
    typingTimeouts.set(
      userId,
      setTimeout(() => {
        typingTimeouts.delete(userId);
        broadcast(
          {
            type: "typing",
            userId: userId,
            username: user.username,
            isTyping: false,
            timestamp: Date.now(),
          },
          null,
          channelId,
        );
      }, 2000),
    );
  }

  broadcast(
    {
      type: "typing",
      userId: userId,
      username: user.username,
      isTyping: isTyping,
      timestamp: Date.now(),
    },
    excludeWs,
    channelId,
  );
}

function broadcast(data, excludeWs = null, channelId = null) {
  const message = JSON.stringify(data);

  clients.forEach((clientData, userId) => {
    const { ws, channelId: clientChannelId } = clientData;
    const shouldSend = !channelId || clientChannelId === channelId;

    if (ws.readyState === WebSocket.OPEN && ws !== excludeWs && shouldSend) {
      ws.send(message);
    }
  });
}

module.exports = {
  addClient,
  welcome,
  notifyUserJoin,
  handleMessage,
  handleDisconnect,
  broadcast,
  clients,
  handleTyping,
  setWss: (wss) => {
    console.log("[setWss] Appelé");
    wssInstance = wss;
    console.log("[setWss] wssInstance définie:", !!wssInstance);
  },
  getActiveClients: async (serverId, channelId) => {
    return clients.size;
  },
};
