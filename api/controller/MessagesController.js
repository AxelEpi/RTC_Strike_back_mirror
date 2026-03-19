// controllers/MessageController.js
const JointurePostMongo = require("../services/jointurePostMongo");
const v = require("../lib/validators");

class MessageController {
  constructor() {
    this.service = JointurePostMongo;
  }

  // POST /servers/:serverId/channels/:channelId/messages
  sendMessage = async (req, res) => {
    try {
      const { serverId, channelId } = req.params;
      const userId = req.user.id;
      const { content } = req.body;

      // Validation
      if (!content || !v.isText(content.trim())) {
        return res.status(400).json({
          success: false,
          error: "Message invalide (lettres, espaces, tirets uniquement)",
        });
      }

      if (content.trim().length < 1 || content.trim().length > 2000) {
        return res.status(400).json({
          success: false,
          error: "Message entre 1 et 2000 caractères",
        });
      }

      const message = await this.service.sendMessage(
        serverId,
        channelId,
        userId,
        content.trim(),
      );

      res.status(201).json({
        success: true,
        message: message,
      });
    } catch (error) {
      console.error("Send message error:", error);

      // Erreurs spécifiques
      if (error.message.includes("Accès refusé")) {
        return res.status(403).json({
          success: false,
          error: "Accès refusé au serveur",
        });
      }
      if (error.message.includes("Canal introuvable")) {
        return res.status(404).json({
          success: false,
          error: "Canal introuvable",
        });
      }

      res.status(500).json({
        success: false,
        error: "Impossible d'envoyer le message",
      });
    }
  };

  // GET /servers/:serverId/channels/:channelId/messages
  getMessages = async (req, res) => {
    try {
      const { serverId, channelId } = req.params;
      const limit = parseInt(req.query.limit) || 50;

      if (limit > 100) {
        return res.status(400).json({
          success: false,
          error: "Limite max 100 messages",
        });
      }

      const messages = await this.service.getMessages(
        serverId,
        channelId,
        limit,
      );

      res.json({
        success: true,
        messages: messages,
        limit: messages.length,
        hasMore: messages.length === limit,
      });
    } catch (error) {
      console.error("Get messages error:", error);

      if (error.message.includes("Accès refusé")) {
        return res.status(403).json({
          success: false,
          error: "Accès refusé au serveur",
        });
      }
      if (error.message.includes("Canal introuvable")) {
        return res.status(404).json({
          success: false,
          error: "Canal introuvable",
        });
      }

      res.status(500).json({
        success: false,
        error: "Impossible de récupérer les messages",
      });
    }
  };

  // DELETE /servers/:serverId/channels/:channelId/messages/:id
  deleteMessage = async (req, res) => {
    try {
      const { serverId, channelId, id: messageId } = req.params;
      const userId = req.user.id;

      await this.service.deleteMessage(serverId, channelId, messageId, userId);

      res.json({
        success: true,
        message: "Message supprimé",
      });
    } catch (error) {
      console.error("Delete message error:", error);

      if (error.message.includes("Accès refusé")) {
        return res.status(403).json({
          success: false,
          error: "Accès refusé au serveur",
        });
      }
      if (error.message.includes("Message introuvable")) {
        return res.status(404).json({
          success: false,
          error: "Message introuvable ou accès refusé",
        });
      }

      res.status(500).json({
        success: false,
        error: "Impossible de supprimer le message",
      });
    }
  };
}

module.exports = MessageController;
