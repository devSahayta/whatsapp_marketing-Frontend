// components/ChatWindow.jsx
import { useEffect, useRef, useState } from "react";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import useAuthUser from "../hooks/useAuthUser";
import { showError } from "../utils/toast";
import ReactMarkdown from "react-markdown";

export default function ChatWindow({ chatId, userInfo, chatMode, onBack }) {
  const { userId } = useAuthUser();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);
  const { getToken } = useKindeAuth();
  const lastTsRef = useRef(null);
  const [sendBlocked, setSendBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState(null);
  const [isSending, setIsSending] = useState(false);

  /* ─── helpers ────────────────────────────────────────── */
  const isNearBottom = () => {
    const el = messagesEndRef.current?.parentElement;
    return !el || el.scrollHeight - el.scrollTop - el.clientHeight < 140;
  };

  const pts = (ts) => {
    try {
      return ts ? new Date(ts) : new Date();
    } catch {
      return new Date();
    }
  };

  const getName = (info) =>
    info?.full_name?.trim() ||
    info?.person_name?.trim() ||
    info?.name?.trim() ||
    info?.phone_number?.trim() ||
    "User";

  const getInitial = (info) => getName(info).charAt(0).toUpperCase();

  const fmtTime = (ts) =>
    ts
      ? pts(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "";

  const sortMsgs = (arr) =>
    (arr || [])
      .map((m) => ({
        ...m,
        created_at: m.created_at || new Date().toISOString(),
      }))
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  const scrollBottom = (behavior = "smooth") =>
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior }), 60);

  /* ─── load messages ──────────────────────────────────── */
  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      return;
    }
    let cancelled = false,
      timer;

    const load = async (initial = false) => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/chats/${chatId}/messages`,
        );
        const data = await res.json();
        if (!data?.ok || !Array.isArray(data.messages)) return;
        const sorted = sortMsgs(data.messages);
        const lastTs = sorted.at(-1)?.created_at;
        if (!initial && lastTsRef.current === lastTs) return;
        lastTsRef.current = lastTs;
        if (!cancelled) {
          if (initial || isNearBottom()) {
            setMessages(sorted);
            scrollBottom("auto");
          } else setMessages(sorted);
        }
      } catch (e) {
        console.error(e);
      }
    };

    load(true);
    timer = setInterval(() => load(false), 3000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [chatId]);

  useEffect(() => {
    scrollBottom();
  }, [messages.length]);

  /* ─── send ───────────────────────────────────────────── */
  const send = async () => {
    const msg = inputText.trim();
    if (!msg || !chatId) return;
    try {
      setIsSending(true);
      const token = await getToken();
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/admin/chat/send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ chat_id: chatId, message: msg }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setSendBlocked(true);
        setBlockReason(data.code);
        showError(data.error || "Cannot send");
        setInputText("");
        return;
      }
      setSendBlocked(false);
      setBlockReason(null);
      setMessages((p) => [
        ...p,
        {
          message_id: `tmp-${Date.now()}`,
          sender_type: "admin",
          message: msg,
          created_at: new Date().toISOString(),
        },
      ]);
      setInputText("");
      scrollBottom();
    } catch {
      showError("Failed to send");
    } finally {
      setIsSending(false);
    }
  };

  /* ─── classification helpers ─────────────────────────── */
  const st = (t) => (t || "").toLowerCase();

  // Bot messages sit LEFT (same side as customer — they're automated, not manual)
  // Admin messages sit RIGHT
  const isRight = (senderType) => st(senderType) === "admin";

  const senderLabel = (t) => {
    switch (st(t)) {
      case "admin":
        return "You";
      case "bot":
        return "Bot";
      default:
        return "User"; // was "Customer"
    }
  };

  const senderStripText = (t) => {
    switch (st(t)) {
      case "admin":
        return "ADMIN";
      case "bot":
        return "BOT";
      default:
        return "USER";
    }
  };

  const startDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const fmtDate = (d) => {
    const today = startDay(new Date());
    const day = startDay(d);
    const diff = Math.round((today - day) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return day.toLocaleDateString([], { weekday: "long" });
    return day.toLocaleDateString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const parseBtns = (b) => {
    if (!b) return [];
    try {
      return typeof b === "string" ? JSON.parse(b) : b;
    } catch {
      return [];
    }
  };

  const dlFile = async (url, name = "file") => {
    try {
      const res = await fetch(url);
      const a = Object.assign(document.createElement("a"), {
        href: URL.createObjectURL(await res.blob()),
        download: name,
      });
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      alert("Download failed");
    }
  };

  const resolveMedia = (path) => {
    if (!path) return null;
    if (path.startsWith("http") && !path.includes("fbsbx.com")) return path;
    if (/^\d+$/.test(path)) {
      if (!userId) return null;
      return `${import.meta.env.VITE_BACKEND_URL}/api/watemplates/media-proxy/${path}?user_id=${userId}`;
    }
    const m = path.match(/[?&]mid=([^&]+)/);
    if (m)
      return `${import.meta.env.VITE_BACKEND_URL}/api/watemplates/media-proxy/${m[1]}?user_id=${userId}`;
    return path;
  };

  const modeInfo = () => {
    const m = (chatMode || "AI").toUpperCase();
    if (m === "BOT") return { label: "Bot Active", cls: "bot" };
    if (m === "MANUAL") return { label: "Live Support", cls: "manual" };
    return { label: "AI Mode", cls: "ai" };
  };

  const MD = {
    p: ({ children }) => (
      <span style={{ display: "block", marginBottom: 2 }}>{children}</span>
    ),
    strong: ({ children }) => <strong>{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    li: ({ children }) => (
      <span style={{ display: "block", paddingLeft: 14, marginBottom: 1 }}>
        • {children}
      </span>
    ),
    ul: ({ children }) => <span style={{ display: "block" }}>{children}</span>,
    ol: ({ children }) => <span style={{ display: "block" }}>{children}</span>,
  };

  /* ─── render message content ─────────────────────────── */
  const renderContent = (msg) => {
    // Sentinel from old logic
    if (msg.message === "__CUSTOMER_SENT_IMAGE__") {
      return (
        <div
          className="wa-message-text"
          style={{ fontStyle: "italic", opacity: 0.6 }}
        >
          📷 Image
        </div>
      );
    }

    if (msg.message_type === "image") {
      const src = resolveMedia(msg.media_path);
      if (!src)
        return (
          <div
            className="wa-message-text"
            style={{ fontStyle: "italic", opacity: 0.6 }}
          >
            📷 Image
          </div>
        );
      return (
        <div className="wa-image-message">
          <img
            src={src}
            alt=""
            className="wa-chat-image"
            onClick={() => window.open(src, "_blank")}
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
          <div
            className="wa-image-download"
            onClick={() => dlFile(src, `img-${msg.message_id}.jpg`)}
          >
            ⬇️
          </div>
        </div>
      );
    }

    if (msg.message_type === "video" && msg.media_path) {
      return (
        <video
          src={msg.media_path}
          controls
          style={{ maxWidth: 220, borderRadius: 10, display: "block" }}
        />
      );
    }

    if (msg.message_type === "document" && msg.media_path) {
      return (
        <div
          className="wa-document-message"
          onClick={() => window.open(msg.media_path, "_blank")}
        >
          <span className="wa-doc-icon">📄</span>
          <div className="wa-doc-info">
            <div className="wa-doc-name">Document</div>
            <div className="wa-doc-meta">Tap to open</div>
          </div>
          <span
            className="wa-doc-download"
            onClick={(e) => {
              e.stopPropagation();
              dlFile(msg.media_path);
            }}
          >
            ⬇️
          </span>
        </div>
      );
    }

    if (
      ["template", "template_video", "template_document"].includes(
        msg.message_type,
      )
    ) {
      const src = resolveMedia(msg.media_path);
      const btns = parseBtns(msg.buttons);
      return (
        <div className="wa-template-message">
          {src && (
            <div
              style={{ marginBottom: 8, borderRadius: 10, overflow: "hidden" }}
            >
              {msg.message_type === "template_video" ? (
                <video
                  src={src}
                  controls
                  style={{ width: "100%", maxHeight: 180, borderRadius: 10 }}
                />
              ) : msg.message_type === "template_document" ? (
                <div
                  className="wa-document-message"
                  style={{ cursor: "pointer" }}
                  onClick={() => window.open(src, "_blank")}
                >
                  <span className="wa-doc-icon">📄</span>
                  <div className="wa-doc-info">
                    <div className="wa-doc-name">Document</div>
                    <div className="wa-doc-meta">Tap to open</div>
                  </div>
                </div>
              ) : (
                <img
                  src={src}
                  alt=""
                  style={{
                    width: "100%",
                    maxHeight: 180,
                    objectFit: "cover",
                    cursor: "pointer",
                    display: "block",
                    borderRadius: 10,
                  }}
                  onClick={() => window.open(src, "_blank")}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              )}
            </div>
          )}
          <div className="wa-message-text" style={{ whiteSpace: "pre-wrap" }}>
            <ReactMarkdown components={MD}>{msg.message}</ReactMarkdown>
          </div>
          {btns.length > 0 && (
            <div className="wa-template-buttons">
              {btns.map((b, i) => (
                <button key={i} className="wa-template-button">
                  {b.type === "URL"
                    ? "🔗 "
                    : b.type === "PHONE_NUMBER"
                      ? "📞 "
                      : ""}
                  {b.text}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Default: plain text / markdown
    return (
      <div className="wa-message-text">
        <ReactMarkdown components={MD}>{msg.message || ""}</ReactMarkdown>
      </div>
    );
  };

  /* ─── placeholder text ───────────────────────────────── */
  const placeholder =
    blockReason === "NO_USER_REPLY"
      ? "User hasn't replied — send a template first"
      : blockReason === "WINDOW_EXPIRED"
        ? "24-hour window expired — send a template"
        : blockReason === "TEMPLATE_ONLY_WAITING_FOR_USER"
          ? "Waiting for user reply…"
          : "Type a message…";

  const mode = modeInfo();

  /* ─── JSX ────────────────────────────────────────────── */
  return (
    <div className="wa-chat-window">
      {/* ── Header ────────────────────────────────────── */}
      <div className="wa-chat-header">
        <div className="wa-header-left">
          <button className="wa-header-back" onClick={onBack}>
            ← Back
          </button>

          <div className="wa-header-avatar">{getInitial(userInfo)}</div>

          <div className="wa-header-meta">
            <h3>{getName(userInfo)}</h3>
            <div className="wa-header-status">
              <span className="wa-status-dot" />
              <span>{userInfo?.phone_number || "WhatsApp"}</span>
            </div>
          </div>
        </div>

        <div className="wa-header-actions">
          <span className={`wa-mode-pill ${mode.cls}`}>{mode.label}</span>
        </div>
      </div>

      {/* ── Messages ──────────────────────────────────── */}
      <div className="wa-messages">
        {messages.map((msg, idx) => {
          const sType = st(msg.sender_type);
          const right = isRight(msg.sender_type);
          const curDate = pts(msg.created_at);
          const prevMsg = messages[idx - 1];
          const prevDate = prevMsg ? pts(prevMsg.created_at) : null;
          const showSep =
            !prevDate ||
            startDay(curDate).getTime() !== startDay(prevDate).getTime();

          // Build CSS class string
          let cls = "wa-message-bubble";
          if (sType === "bot") cls += " sender-bot";
          else if (right) cls += " sender-admin";
          else cls += " received";

          return (
            <div key={msg.message_id} className="wa-message-row">
              {showSep && (
                <div className="wa-date-separator">{fmtDate(curDate)}</div>
              )}

              <div className={cls}>
                {/* Tiny sender label */}
                <span className="wa-sender-strip">
                  {senderStripText(msg.sender_type)}
                </span>

                {renderContent(msg)}

                <div className="wa-message-time">
                  {fmtTime(msg.created_at)}
                  <span className="wa-sender-type">
                    · {senderLabel(msg.sender_type)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ─────────────────────────────────────── */}
      <div className="wa-input-area">
        {sendBlocked ? (
          <div className="wa-input-blocked">🔒 {placeholder}</div>
        ) : (
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder={placeholder}
          />
        )}

        <button
          className="wa-send-btn"
          disabled={isSending || sendBlocked || !inputText.trim()}
          onClick={send}
          aria-label="Send"
        >
          {isSending ? (
            <span
              style={{
                width: 15,
                height: 15,
                border: "2px solid rgba(255,255,255,0.25)",
                borderTopColor: "#fff",
                borderRadius: "50%",
                display: "inline-block",
                animation: "spin 0.7s linear infinite",
              }}
            />
          ) : (
            /* Send arrow icon */
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
