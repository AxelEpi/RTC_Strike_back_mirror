"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useSocket } from "../../lib/socket";

export default function ChatBox({
  channelName = "general",
  serverId,
  channelId,
}) {
  console.log("🔍 DIAGNOSTIC ChatBoxProps:");
  console.log("  channelName:", channelName);
  console.log("  serverId:", serverId);
  console.log("  channelId:", channelId);

  // Protection : Ne pas rendre si serverId ou channelId sont undefined
  if (!serverId || !channelId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Chargement du chat...</p>
      </div>
    );
  }

  const {
    messages,
    setMessages,
    sendMessage,
    systemMsg,
    isTyping,
    typingMsg,
    sendTyping,
    errorMsg,
    sendMessageDelete,
    sendMessageEdit,
    channelInfo,
    userId,
  } = useSocket(serverId, channelId);

  const canSend = Boolean(userId);

  const [input, setInput] = useState("");
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTyping = (e) => {
    setInput(e.target.value);
    if (canSend) {
      sendTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => sendTyping(false), 1500);
    }
  };
  const inputValue = editingId ? editContent : input;
  const inputOnChange = editingId
    ? (e) => setEditContent(e.target.value)
    : handleTyping;
  const placeholder = editingId
    ? "Modifier le message... (Enter pour valider, Escape pour annuler)"
    : `Message #${channelName}`;

  const handleSend = useCallback(() => {
    // MODE EDITION (si editingId existe)
    if (editingId && editContent.trim() && canSend) {
      // 1. OPTIMISTIC UPDATE : modifier localement IMMÉDIATEMENT
      const updatedMessages = messages.map((msg) =>
        msg._id === editingId
          ? { ...msg, content: editContent.trim(), edited: true }
          : msg,
      );
      setMessages(updatedMessages); // Apply optimistic update immediately
      sendMessageEdit(editingId, editContent.trim()); //envoyer au server
      setEditingId(null); // Quitter mode edit
      setEditContent(""); // Vider edit
      sendTyping(false);
      return;
    }

    // MODE ENVOI NORMAL (pas d'édition)
    if (input.trim() && canSend) {
      sendMessage(input.trim());
      setInput(""); // Vider input normal
      sendTyping(false);
    }
  }, [
    editingId,
    editContent,
    input,
    canSend,
    sendMessageEdit,
    sendMessage,
    sendTyping,
    messages,
    setMessages,
  ]);
  const handleDelete = useCallback(
    (messageId) => {
      if (confirm("Supprimer ce message ?")) {
        console.log("🗑️ Suppression du message:", messageId);
        // Optimistic update: mark as deleted immediately
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageId ? { ...msg, deleted: true } : msg,
          ),
        );
        sendMessageDelete(messageId);
      }
    },
    [sendMessageDelete, setMessages],
  );

  const handleEditStart = useCallback((messageId, currentContent) => {
    setEditingId(messageId);
    setEditContent(currentContent);
  }, []);

  const handleEditCancel = useCallback(() => {
    setEditingId(null);
    setEditContent("");
  }, []);

  // Fonction pour obtenir la couleur du rôle
  const getRoleColor = (role) => {
    const roleUpper = role?.toUpperCase();
    switch (roleUpper) {
      case "OWNER":
        return "#ff6b6b";
      case "ADMIN":
        return "#7c3aed";
      default:
        return "#64748b";
    }
  };

  // Fonction pour obtenir les initiales
  const getInitials = (username, userId) => {
    if (username) {
      return username
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return userId?.toString().substring(0, 2).toUpperCase() || "??";
  };

  return (
    <div className="flex flex-col h-screen bg-[#1a202c]">
      {/* Channel Header */}
      <div className="h-14 border-b border-[#1e293b] px-3 md:px-6 flex items-center shadow-md flex-shrink-0 bg-[#1a202c]">
        <span className="text-[#7c3aed] text-xl md:text-2xl font-bold mr-2 md:mr-3">
          #
        </span>
        <h2 className="text-[#e2e8f0] font-bold text-base md:text-lg">
          {channelName}
        </h2>
        <div className="ml-3 md:ml-6 h-6 w-px bg-[#334155] hidden sm:block"></div>
        <p className="ml-3 md:ml-6 text-xs md:text-sm text-[#94a3b8] hidden sm:block">
          {channelInfo?.description || "Aucune description"}
        </p>
        {/* Message error */}
      </div>

      {errorMsg && (
        <div className="px-3 md:px-6 py-2 bg-red-500/20 border-l-4 border-red-500 text-red-300 text-xs md:text-sm animate-pulse">
          {errorMsg}
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto pb-4 bg-[#1a202c]">
        {/* Welcome to channel */}
        <div className="px-3 md:px-6 pt-6 md:pt-8 pb-2">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-[#1e293b] rounded-xl flex items-center justify-center mb-3 md:mb-4 border-2 border-[#7c3aed]">
            <span className="text-2xl md:text-3xl text-[#7c3aed]">#</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-[#e2e8f0] mb-2">
            Welcome to #{channelName}!
          </h3>
          <p className="text-xs md:text-sm text-[#94a3b8]">
            This is the start of the #{channelName} channel.
          </p>
        </div>

        {/* System Message */}
        {systemMsg && (
          <div className="px-3 md:px-6 py-1">
            <div className="flex items-center gap-2 text-xs">
              <div
                className={`w-2 h-2 rounded-full ${systemMsg.includes("rejoint") ? "bg-green-500" : "bg-red-500"}`}
              ></div>
              <span className="text-[#94a3b8] italic">{systemMsg}</span>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="px-3 md:px-6 pt-4">
          {messages.map((msg, i) => {
            const isOwn = msg.userId === userId;
            const prevMsg = messages[i - 1];
            const isSameUser = prevMsg && prevMsg.userId === msg.userId;
            const timeDiff = prevMsg
              ? new Date(msg.createdAt || msg.timestamp) -
                new Date(prevMsg.createdAt || prevMsg.timestamp)
              : 0;
            const isGrouped = isSameUser && timeDiff < 300000; // 5 minutes

            // Déterminer le rôle (à adapter selon vos données)
            const userRole = msg.role || (isOwn ? "MEMBER" : "MEMBER");
            const roleColor = getRoleColor(userRole);

            return (
              <div
                key={msg._id || `chat-${i}`}
                className={`group hover:bg-[#1e293b]/40 -mx-6 px-6 rounded transition-colors ${isGrouped ? "py-0.5" : "mt-4 py-2"} ${isOwn ? "bg-[#7c3aed]/5 hover:bg-[#7c3aed]/10 border-l-2 border-[#7c3aed]" : ""}`}
              >
                {!isGrouped ? (
                  // Message avec avatar et nom
                  <div className="flex gap-4">
                    <div className="w-10 h-10 flex-shrink-0">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-lg"
                        style={{ backgroundColor: roleColor }}
                      >
                        {getInitials(msg.username, msg.userId)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 relative">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span
                          className="font-semibold hover:underline cursor-pointer"
                          style={{ color: roleColor }}
                        >
                          {isOwn
                            ? "Moi"
                            : msg.username || `User ${msg.userId?.slice(-4)}`}
                        </span>
                        {userRole && userRole !== "MEMBER" && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{
                              backgroundColor: `${roleColor}20`,
                              color: roleColor,
                              border: `1px solid ${roleColor}40`,
                            }}
                          >
                            {msg.role}
                          </span>
                        )}
                        <span className="text-xs text-[#64748b]">
                          {new Date(
                            msg.createdAt || msg.timestamp || Date.now(),
                          ).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="text-[#e2e8f0] text-sm break-words">
                        {msg.deleted ? (
                          <span className="text-[#64748b] italic">
                            [Message supprimé]
                          </span>
                        ) : (
                          msg.content || msg.message
                        )}
                        {msg.edited && (
                          <span className="text-xs text-[#64748b] italic ml-2">
                            (édité)
                          </span>
                        )}
                      </div>
                      {/* BOUTONS - SEULEMENT PROPRES MESSAGES - Positionnés en absolu en haut à droite */}
                      {isOwn && !msg.deleted && (
                        <div className="absolute -top-4 right-0 opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity">
                          <button
                            onClick={() =>
                              handleEditStart(
                                msg._id,
                                msg.content || msg.message,
                              )
                            }
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e293b] hover:bg-[#7c3aed] text-[#94a3b8] hover:text-white text-xs font-medium rounded-md transition-all duration-200 border border-[#334155] hover:border-[#7c3aed] hover:shadow-lg hover:shadow-[#7c3aed]/20"
                            title="Modifier ce message"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDelete(msg._id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e293b] hover:bg-red-500 text-[#94a3b8] hover:text-white text-xs font-medium rounded-md transition-all duration-200 border border-[#334155] hover:border-red-500 hover:shadow-lg hover:shadow-red-500/20"
                            title="Supprimer ce message"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Timestamp au hover */}
                    <div className="opacity-0 group-hover:opacity-100 text-xs text-[#64748b] transition-opacity">
                      {new Date(
                        msg.createdAt || msg.timestamp || Date.now(),
                      ).toLocaleTimeString("fr-FR")}
                    </div>
                  </div>
                ) : (
                  // Message compact (groupé)
                  <div className="flex gap-4">
                    <div className="w-10 flex-shrink-0 flex items-center justify-center">
                      <span className="text-xs text-[#64748b] opacity-0 group-hover:opacity-100 transition-opacity">
                        {new Date(
                          msg.createdAt || msg.timestamp || Date.now(),
                        ).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 relative">
                      <div className="text-[#e2e8f0] text-sm break-words">
                        {msg.deleted ? (
                          <span className="text-[#64748b] italic">
                            [Message supprimé]
                          </span>
                        ) : (
                          msg.content || msg.message
                        )}
                        {msg.edited && (
                          <span className="text-xs text-[#64748b] italic ml-2">
                            (édité)
                          </span>
                        )}
                      </div>
                      {/* BOUTONS - SEULEMENT PROPRES MESSAGES - Positionnés en absolu en haut à droite */}
                      {isOwn && !msg.deleted && (
                        <div className="absolute -top-4 right-0 opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity">
                          <button
                            onClick={() =>
                              handleEditStart(
                                msg._id,
                                msg.content || msg.message,
                              )
                            }
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e293b] hover:bg-[#7c3aed] text-[#94a3b8] hover:text-white text-xs font-medium rounded-md transition-all duration-200 border border-[#334155] hover:border-[#7c3aed] hover:shadow-lg hover:shadow-[#7c3aed]/20"
                            title="Modifier ce message"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDelete(msg._id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e293b] hover:bg-red-500 text-[#94a3b8] hover:text-white text-xs font-medium rounded-md transition-all duration-200 border border-[#334155] hover:border-red-500 hover:shadow-lg hover:shadow-red-500/20"
                            title="Supprimer ce message"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Typing Indicator */}
      {isTyping && typingMsg && (
        <div className="px-3 md:px-6 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs md:text-sm text-[#94a3b8]">
            <div className="flex gap-1">
              <div
                className="w-2 h-2 bg-[#7c3aed] rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              ></div>
              <div
                className="w-2 h-2 bg-[#7c3aed] rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              ></div>
              <div
                className="w-2 h-2 bg-[#7c3aed] rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              ></div>
            </div>
            <span className="italic">{typingMsg}</span>
          </div>
        </div>
      )}

      {/* Input Area avec marge en haut */}
      <div className="px-2 md:px-4 pb-3 md:pb-4 pt-3 flex-shrink-0 bg-[#1a202c]">
        <div className="relative">
          <input
            value={inputValue}
            onChange={inputOnChange}
            onKeyDown={(e) => {
              if (e.key === "Escape" && editingId) {
                handleEditCancel();
                return;
              }
              if (e.key === "Enter" && !e.shiftKey) {
                handleSend();
              }
            }}
            placeholder={placeholder}
            disabled={!canSend}
            className="w-full px-2 md:px-3 py-2 md:py-2.5 pr-10 md:pr-12 bg-[#1e293b] border border-[#334155]/50 text-[#e2e8f0] rounded-md focus:outline-none focus:border-[#7c3aed] transition-all placeholder:text-[#64748b] disabled:opacity-50 disabled:cursor-not-allowed focus:ring-1 focus:ring-[#7c3aed]/30 hover:border-[#475569] text-sm md:text-base"
          />
        </div>
      </div>
    </div>
  );
}
