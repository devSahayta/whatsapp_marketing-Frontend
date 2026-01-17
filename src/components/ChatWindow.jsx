import { useEffect, useRef, useState } from "react";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import useAuthUser from "../hooks/useAuthUser";

export default function ChatWindow({ chatId, userInfo }) {
  const { userId } = useAuthUser();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);
  const { getToken } = useKindeAuth();
  const lastMessageTsRef = useRef(null);

  /* ================= HELPERS ================= */

  const isNearBottom = () => {
    const el = messagesEndRef.current?.parentElement;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  const parseTs = (ts) => {
    try {
      return ts ? new Date(ts) : new Date();
    } catch {
      return new Date();
    }
  };

  const getParticipantName = (userInfo) => {
    if (!userInfo) return "User";

    if (userInfo.full_name?.trim()) return userInfo.full_name;
    if (userInfo.person_name?.trim()) return userInfo.person_name;
    if (userInfo.name?.trim()) return userInfo.name;
    if (userInfo.phone_number?.trim()) return userInfo.phone_number;
    if (userInfo.phone?.trim()) return userInfo.phone;

    return "User";
  };

  const formatBubbleTime = (timestamp) => {
    if (!timestamp) return "";
    return parseTs(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const normalizeAndSort = (arr) => {
    const normalized = (arr || []).map((m) => ({
      ...m,
      created_at: m.created_at || new Date().toISOString(),
    }));
    normalized.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return normalized;
  };

  const scrollToBottom = (behavior = "smooth") => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }, 60);
  };

  /* ================= LOAD MESSAGES ================= */

  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    let intervalId;

    const loadMessages = async (initial = false) => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/chats/${chatId}/messages`
        );
        const data = await res.json();
        if (!data?.ok || !Array.isArray(data.messages)) return;

        const sorted = normalizeAndSort(data.messages);
        const lastTs = sorted.at(-1)?.created_at;

        if (!initial && lastMessageTsRef.current === lastTs) return;
        lastMessageTsRef.current = lastTs;

        if (!cancelled) {
          const shouldScroll = initial || isNearBottom();
          setMessages(sorted);
          if (shouldScroll) scrollToBottom("auto");
        }
      } catch (err) {
        console.error("Error loading messages:", err);
      }
    };

    loadMessages(true);
    intervalId = setInterval(() => loadMessages(false), 3000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  /* ================= MESSAGE UTILS ================= */

  const isSentByAdmin = (sender_type) =>
    sender_type?.toLowerCase() === "admin";

  const getSenderLabel = (sender_type) =>
    sender_type?.toLowerCase() === "admin" ? "Admin" : "User";

  /* ================= DATE SEPARATORS ================= */

  const startOfDay = (d) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const formatDateLabel = (date) => {
    const today = startOfDay(new Date());
    const msgDay = startOfDay(date);
    const diffDays = Math.round(
      (today - msgDay) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7)
      return msgDay.toLocaleDateString([], { weekday: "long" });

    return msgDay.toLocaleDateString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /* ================= SEND MESSAGE ================= */

  const sendMessage = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || !chatId) return;

    const temp = {
      message_id: `temp-${Date.now()}`,
      sender_type: "admin",
      message: trimmed,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, temp]);
    setInputText("");
    scrollToBottom();

    try {
      const token = await getToken();
      await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/admin/chat/send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ chat_id: chatId, message: trimmed }),
        }
      );
    } catch (err) {
      console.error("Send message failed:", err);
    }
  };
const parseButtons = (buttons) => {
  if (!buttons) return [];
  try {
    return typeof buttons === "string" ? JSON.parse(buttons) : buttons;
  } catch (err) {
    console.error("Failed to parse buttons:", err);
    return [];
  }
};

  /* ================= UI ================= */

  return (
    <div className="wa-chat-window">
      {/* HEADER */}
      <div className="wa-chat-header">
        <div className="wa-header-left">
          <div className="wa-header-avatar">
            {getParticipantName(userInfo).charAt(0).toUpperCase()}
          </div>
          <div className="wa-header-meta">
            <h3>{getParticipantName(userInfo)}</h3>
            <div className="wa-last-seen">👤 Participant</div>
          </div>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="wa-messages">
        {messages.map((msg, index) => {
          const sent = isSentByAdmin(msg.sender_type);
          const currentDate = parseTs(msg.created_at);
          const prevMsg = messages[index - 1];
          const prevDate = prevMsg ? parseTs(prevMsg.created_at) : null;

          const showDateSeparator =
            !prevDate ||
            startOfDay(currentDate).getTime() !==
              startOfDay(prevDate).getTime();

          return (
            <div key={msg.message_id} className="wa-message-row">
              {showDateSeparator && (
                <div className="wa-date-separator">
                  {formatDateLabel(currentDate)}
                </div>
              )}

              <div className={`wa-message-bubble ${sent ? "sent" : "received"}`}>
  {/* Message Text */}
  <div className="wa-message-text">{msg.message}</div>

  {/* WhatsApp Template Buttons */}
  {msg.message_type === "template" &&
    parseButtons(msg.buttons).length > 0 && (
      <div className="wa-template-buttons">
        {parseButtons(msg.buttons).map((btn, i) => (
          <button
            key={i}
            className="wa-template-button"
            onClick={() => {
              console.log("Template button clicked:", btn.text);
              // later → send this back to backend if needed
            }}
          >
            {btn.text}
          </button>
        ))}
      </div>
    )}

  {/* Meta */}
  <div className="wa-message-time">
    {formatBubbleTime(msg.created_at)} ·{" "}
    <span className="wa-sender-type">
      {getSenderLabel(msg.sender_type)}
    </span>
  </div>
</div>

            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div className="wa-input-area">
        <input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message…"
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
