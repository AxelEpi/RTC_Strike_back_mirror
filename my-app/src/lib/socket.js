"use client";
import { useEffect, useState, useRef, useCallback } from "react";

export const useSocket = (serverId, channelId) => {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("Connecting...");
  const [welcomeMsg, setWelcomeMsg] = useState("");
  const [systemMsg, setSystemMsg] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingMsg, setTypingMsg] = useState("");
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(null);
  const [error, setError] = useState(null);

  const wsRef = useRef();
  const systemMsgTimeoutRef = useRef(null);
  const [channelInfo, setChannelInfo] = useState({ description: "" });
  let pendingEdits = useRef({});

  useEffect(() => {
    if (!systemMsg) return;
    if (systemMsgTimeoutRef.current) clearTimeout(systemMsgTimeoutRef.current);
    systemMsgTimeoutRef.current = setTimeout(() => {
      setSystemMsg("");
    }, 5000);
    return () => {
      if (systemMsgTimeoutRef.current)
        clearTimeout(systemMsgTimeoutRef.current);
    };
  }, [systemMsg]);

  useEffect(() => {
    if (!serverId || !channelId) return;

    console.log("\n[useSocket] Initialisation WebSocket");
    console.log("[useSocket] serverId:", serverId);
    console.log("[useSocket] channelId:", channelId);

    const token = localStorage.getItem("token");
    console.log(
      "[useSocket] Token:",
      token ? `${token.substring(0, 20)}...` : "MANQUANT",
    );

    // Modification: Ne pas bloquer si pas de token (les cookies peuvent suffire)
    const params = new URLSearchParams({
      serverId,
      channelId,
    });
    if (token) params.append("token", token);

    const wsUrl = `ws://localhost:4000/ws?${params.toString()}`;
    console.log("[useSocket] URL WebSocket:", wsUrl);

    // Fermer l'ancienne connexion si elle existe
    if (wsRef.current) {
      wsRef.current.close();
    }

    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log("[useSocket] WebSocket OUVERT");
      setStatus("Connected");
    };

    wsRef.current.onmessage = (event) => {
      console.log("\n[useSocket] MESSAGE REÇU");
      console.log("[useSocket] Data brute:", event.data);

      const data = JSON.parse(event.data);
      console.log("[useSocket] Data parsée:", data);
      console.log("[useSocket] Type:", data.type);

      switch (data.type) {
        case "welcome":
          console.log("[useSocket] WELCOME:", data);
          setStatus(`Connection réussie (${data.totalClients} utilisateurs)`);
          setWelcomeMsg(data.message);

          // Extraire les infos utilisateur depuis le message welcome
          if (data.user) {
            console.log("[useSocket] User depuis welcome:", data.user);
            setUserId(data.user.id);
            setUsername(data.user.username);
            console.log("[useSocket] ✅ userId défini:", data.user.id);
          }
          break;

        case "message":
          setMessages((prev) => [
            ...prev,
            {
              ...data,
              userId: data.userId,
              username: data.username,
              role: data.role || "MEMBER",
              content: data.content,
              createdAt: data.createdAt,
              edited: data.edited || false,
              type: "message",
            },
          ]);
          break;

        case "system":
          if (data.subtype === "user_joined") {
            setSystemMsg(`${data.message}`);
          } else if (data.subtype === "user_left") {
            setSystemMsg(`${data.message}`);
          } else {
            setSystemMsg(data.message);
          }
          break;

        case "typing":
          if (data.userId !== userId) {
            // Ne pas afficher son propre typing
            if (data.isTyping) {
              const nameToShow =
                data.username || `User ${data.userId?.slice(-4)}`;
              setTypingMsg(`${nameToShow} tape...`);
              setIsTyping(true);
            } else {
              setTypingMsg("");
              setIsTyping(false);
            }
          }
          break;

        case "delete":
          console.log("[useSocket] DELETE:", data.messageId);
          setMessages((prev) =>
            prev.filter((msg) => msg._id !== data.messageId),
          );
          break;

        case "edit":
          setMessages((prev) => {
            if (prev.length === 0) {
              pendingEdits.current[data._id || data.messageId] = data;
              return prev;
            }

            return prev.map((msg) => {
              if (msg._id === data._id || msg._id === data.messageId) {
                return {
                  ...msg,
                  content: data.content || data.newContent,
                  edited: true,
                };
              }
              return msg;
            });
          });
          break;

        case "history":
          if (data.user) {
            setUserId(data.user.id);
            setUsername(data.user.username);
            setStatus(`Connecté en tant que ${data.user.username}`);
          }

          setMessages(
            data.history.map((msg) => ({
              _id: msg._id,
              userId: msg.userId,
              username: msg.username,
              role: msg.role || "MEMBER",
              content: msg.content,
              createdAt: msg.createdAt,
              edited: msg.edited || false,
              type: "message",
            })),
          );

          Object.values(pendingEdits.current || {}).forEach((edit) => {
            console.log("[useSocket] Application edit en attente:", edit._id);
            setMessages((prev) =>
              prev.map((msg) =>
                msg._id === edit._id
                  ? { ...msg, content: edit.content, edited: edit.edited }
                  : msg,
              ),
            );
          });
          pendingEdits.current = {};

          if (Array.isArray(data.typingUsers)) {
            data.typingUsers.forEach((id) => {
              if (id !== data.user?.id) {
                setTypingMsg(`L'utilisateur #${id} tape...`);
                setIsTyping(true);
              }
            });
          }
          break;

        case "auth_success":
          console.log("[useSocket] AUTH SUCCESS:", data);
          setUserId(data.userId);
          setUsername(data.username);
          setStatus(`Connecté en tant que ${data.username}`);
          break;

        case "error":
          console.error("[useSocket] ERREUR du serveur:", data.message);
          setStatus(`Erreur: ${data.message}`);
          setError(data.message);
          break;
        case "channel_info":
          console.log("[useSocket] CHANNEL_INFO:", data);
          setChannelInfo({
            description: data.description || "",
            serverId: data.serverId,
            channelId: data.channelId
          });
          break;
        default:
          console.log("[useSocket] Type inconnu:", data.type);
          setStatus(data.message || status);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error("[useSocket] WebSocket ERROR:", error);
      setStatus("Erreur de connexion");
    };

    wsRef.current.onclose = (event) => {
      console.log("[useSocket] WebSocket FERMÉ");
      console.log("[useSocket] Code:", event.code);
      console.log("[useSocket] Raison:", event.reason);
      setStatus("Disconnected from the server");
    };

    return () => {
      console.log("[useSocket] Cleanup - fermeture WebSocket");
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [serverId, channelId]);

  const sendMessage = useCallback((message) => {
    console.log("\n[useSocket] sendMessage appelé");
    console.log("[useSocket] Message:", message);
    console.log("[useSocket] État WS:", wsRef.current?.readyState);
    console.log("[useSocket] 0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED");

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const payload = {
        type: "chat",
        message: message.trim(),
      };
      console.log("[useSocket] Payload:", payload);
      wsRef.current.send(JSON.stringify(payload));
      console.log("[useSocket] Message envoyé");
    } else {
      console.error(
        "[useSocket] WebSocket pas ouvert, état:",
        wsRef.current?.readyState,
      );
    }
  }, []);

  const sendTyping = useCallback(
    (isTyping) => {
      console.log(`[useSocket] sendTyping(${isTyping})`);
      if (wsRef.current?.readyState === WebSocket.OPEN && userId) {
        wsRef.current.send(
          JSON.stringify({
            type: "typing",
            userId: userId,
            isTyping: isTyping,
          }),
        );
        console.log("[useSocket] Typing envoyé");
      } else {
        console.error("[useSocket] Impossible d'envoyer typing");
      }
    },
    [userId],
  );

  const sendMessageDelete = useCallback((messageId) => {
    console.log(`[useSocket] sendMessageDelete(${messageId})`);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "delete_message",
          messageId,
        }),
      );
      console.log("[useSocket] Delete envoyé");
    } else {
      console.error("[useSocket] Impossible d'envoyer delete");
    }
  }, []);

  const sendMessageEdit = useCallback((messageId, newContent) => {
    console.log(`[useSocket] sendMessageEdit(${messageId})`);
    console.log("[useSocket] newContent:", newContent);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg._id === messageId) {
            console.log("[useSocket] Mise à jour optimiste locale");
            return {
              ...msg,
              content: newContent.trim(),
              edited: true,
            };
          }
          return msg;
        }),
      );

      wsRef.current.send(
        JSON.stringify({
          type: "edit_message",
          messageId: messageId,
          newContent: newContent.trim(),
        }),
      );
      console.log("[useSocket] Edit envoyé");
    } else {
      console.error("[useSocket] Impossible d'envoyer edit");
    }
  }, []);

  return {
    messages,
    setMessages,
    status,
    sendMessage,
    welcomeMsg,
    systemMsg,
    isTyping,
    setIsTyping,
    setTypingMsg,
    typingMsg,
    sendTyping,
    sendMessageDelete,
    sendMessageEdit,
    userId,
    username,
    channelInfo,
    errorMsg: error,
  };
};
