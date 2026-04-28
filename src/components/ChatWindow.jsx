//components/ChatWindow.jsx

import { useEffect, useRef, useState } from "react";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import useAuthUser from "../hooks/useAuthUser";
import { showError } from "../utils/toast";
import ReactMarkdown from "react-markdown";

export default function ChatWindow({ chatId, userInfo }) {
  const { userId } = useAuthUser();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);
  const { getToken } = useKindeAuth();
  const lastMessageTsRef = useRef(null);

  const [sendBlocked, setSendBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState(null);
  const [isSending, setIsSending] = useState(false);

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
          `${import.meta.env.VITE_BACKEND_URL}/api/chats/${chatId}/messages`,
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
    ["admin", "bot"].includes(sender_type?.toLowerCase());

  const getSenderLabel = (sender_type) => {
    switch (sender_type?.toLowerCase()) {
      case "admin":
        return "Admin";
      case "bot":
        return "🤖 Bot";
      case "system":
        return "System";
      default:
        return "User";
    }
  };

  /* ================= DATE SEPARATORS ================= */

  const startOfDay = (d) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const formatDateLabel = (date) => {
    const today = startOfDay(new Date());
    const msgDay = startOfDay(date);
    const diffDays = Math.round((today - msgDay) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return msgDay.toLocaleDateString([], { weekday: "long" });

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
          body: JSON.stringify({ chat_id: chatId, message: trimmed }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        setSendBlocked(true);
        setBlockReason(data.code);
        showError(data.error || "Message not allowed");
        setInputText("");
        return;
      }

      setSendBlocked(false);
      setBlockReason(null);

      setMessages((prev) => [
        ...prev,
        {
          message_id: `temp-${Date.now()}`,
          sender_type: "admin",
          message: trimmed,
          created_at: new Date().toISOString(),
        },
      ]);

      setInputText("");
      scrollToBottom();
    } catch (err) {
      console.error("Send message failed:", err);
      showError("Failed to send message");
    } finally {
      setIsSending(false);
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

  const downloadFile = async (url, filename = "image.jpg") => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();

      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download file");
    }
  };

  console.log({ messages, inputText });

  // Resolves any media_path to a renderable URL.
  // Handles: plain URLs, numeric Meta media IDs (→ proxy), expiring fbsbx URLs (→ proxy).
  const getTemplatMediaSrc = (mediaPath) => {
    if (!mediaPath) return null;

    // Already a full non-Meta URL (Supabase, CDN, etc.) — use directly
    if (mediaPath.startsWith("http") && !mediaPath.includes("fbsbx.com")) {
      return mediaPath;
    }

    // Numeric Meta media ID → proxy
    if (/^\d+$/.test(mediaPath)) {
      if (!userId) {
        console.warn("⚠️ userId missing for media proxy — image won't load");
        return null;
      }
      return `${import.meta.env.VITE_BACKEND_URL}/api/watemplates/media-proxy/${mediaPath}?user_id=${userId}`;
    }

    // Expiring fbsbx.com URL → extract mid and proxy
    const midMatch = mediaPath.match(/[?&]mid=([^&]+)/);
    if (midMatch) {
      return `${import.meta.env.VITE_BACKEND_URL}/api/watemplates/media-proxy/${midMatch[1]}?user_id=${userId}`;
    }

    return mediaPath;
  };

  // Renders an image bubble given a resolved src URL
  const renderImageBubble = (msg, src) => (
    <div className="wa-image-message">
      <img
        src={src}
        alt="Image"
        className="wa-chat-image"
        onClick={() => window.open(src, "_blank")}
        onError={(e) => {
          console.error("❌ Image failed to load:", e.target.src);
          e.target.style.display = "none";
          e.target.nextSibling && (e.target.nextSibling.style.display = "none");
          // Show fallback text
          const fallback = document.createElement("div");
          fallback.textContent = "📷 Image (failed to load)";
          fallback.style.cssText =
            "color:#94a3b8;font-style:italic;padding:4px 0";
          e.target.parentElement.appendChild(fallback);
        }}
      />
      <div
        className="wa-image-download"
        onClick={() => downloadFile(src, `image-${msg.message_id}.jpg`)}
        title="Download"
      >
        ⬇️
      </div>
    </div>
  );

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
            <div className="wa-last-seen"> Participant</div>
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

              <div
                className={`wa-message-bubble ${sent ? "sent" : "received"}`}
              >
                {/* ── Message content ── */}
                {msg.message === "__CUSTOMER_SENT_IMAGE__" ? (
                  // Sentinel text stored before we had proper image saving
                  <div
                    className="wa-message-text"
                    style={{ color: "#94a3b8", fontStyle: "italic" }}
                  >
                    📷 Image
                  </div>
                ) : msg.message_type === "image" && msg.media_path ? (
                  // Image message — media_path may be a URL or a numeric Meta media ID.
                  // getTemplatMediaSrc handles both cases (direct URL or proxy).
                  (() => {
                    const src = getTemplatMediaSrc(msg.media_path);
                    return src ? (
                      renderImageBubble(msg, src)
                    ) : (
                      <div
                        className="wa-message-text"
                        style={{ color: "#94a3b8", fontStyle: "italic" }}
                      >
                        📷 Image
                      </div>
                    );
                  })()
                ) : msg.message_type === "image" && !msg.media_path ? (
                  // image type but no path stored
                  <div
                    className="wa-message-text"
                    style={{ color: "#94a3b8", fontStyle: "italic" }}
                  >
                    📷 Image
                  </div>
                ) : msg.message_type === "video" && msg.media_path ? (
                  <div className="wa-document-message">
                    <video
                      src={msg.media_path}
                      controls
                      style={{ maxWidth: "100%", borderRadius: 8 }}
                    />
                  </div>
                ) : msg.message_type === "document" && msg.media_path ? (
                  <div
                    className="wa-document-message"
                    onClick={() => window.open(msg.media_path, "_blank")}
                  >
                    <div className="wa-doc-icon">📄</div>
                    <div className="wa-doc-info">
                      <div className="wa-doc-name">Document</div>
                      <div className="wa-doc-meta">Click to view</div>
                    </div>
                    <div
                      className="wa-doc-download"
                      onClick={() =>
                        downloadFile(
                          msg.media_path,
                          `doc-${msg.message_id}.pdf`,
                        )
                      }
                      title="Download"
                    >
                      ⬇️
                    </div>
                  </div>
                ) : msg.message_type === "template" ||
                  msg.message_type === "template_video" ||
                  msg.message_type === "template_document" ? (
                  <div className="wa-template-message">
                    {msg.media_path && getTemplatMediaSrc(msg.media_path) && (
                      <div style={{ marginBottom: 6 }}>
                        {msg.message_type === "template_video" ? (
                          <video
                            src={getTemplatMediaSrc(msg.media_path)}
                            controls
                            style={{
                              width: "100%",
                              borderRadius: "8px 8px 0 0",
                              maxHeight: 200,
                            }}
                            onError={(e) =>
                              console.error(
                                "❌ Template video failed to load:",
                                e.target.src,
                              )
                            }
                          />
                        ) : msg.message_type === "template_document" ? (
                          <div
                            className="wa-document-message"
                            style={{ cursor: "pointer" }}
                            onClick={() =>
                              window.open(
                                getTemplatMediaSrc(msg.media_path),
                                "_blank",
                              )
                            }
                          >
                            <div className="wa-doc-icon">📄</div>
                            <div className="wa-doc-info">
                              <div className="wa-doc-name">Document</div>
                              <div className="wa-doc-meta">Click to view</div>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={getTemplatMediaSrc(msg.media_path)}
                            alt="Template header"
                            style={{
                              width: "100%",
                              borderRadius: "8px 8px 0 0",
                              maxHeight: 200,
                              objectFit: "cover",
                              cursor: "pointer",
                              display: "block",
                            }}
                            onClick={() =>
                              window.open(
                                getTemplatMediaSrc(msg.media_path),
                                "_blank",
                              )
                            }
                            onError={(e) => {
                              console.error(
                                "❌ Template image failed to load:",
                                e.target.src,
                              );
                              e.target.style.display = "none";
                            }}
                          />
                        )}
                      </div>
                    )}

                    <div
                      className="wa-message-text"
                      style={{ whiteSpace: "pre-wrap" }}
                    >
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => (
                            <span style={{ display: "block", marginBottom: 4 }}>
                              {children}
                            </span>
                          ),
                          strong: ({ children }) => <strong>{children}</strong>,
                          em: ({ children }) => <em>{children}</em>,
                        }}
                      >
                        {msg.message}
                      </ReactMarkdown>
                    </div>

                    {parseButtons(msg.buttons).length > 0 && (
                      <div
                        style={{
                          borderTop: "1px solid rgba(0,0,0,0.1)",
                          marginTop: 8,
                          paddingTop: 8,
                        }}
                      >
                        {parseButtons(msg.buttons).map((btn, i) => (
                          <button
                            key={i}
                            className="wa-template-button"
                            style={{
                              display: "block",
                              width: "100%",
                              textAlign: "center",
                              padding: "6px",
                              marginTop: i > 0 ? 4 : 0,
                              background: "rgba(0,120,255,0.08)",
                              border: "none",
                              borderRadius: 6,
                              color: "#0078ff",
                              fontWeight: 600,
                              cursor: "pointer",
                              fontSize: 13,
                            }}
                          >
                            {btn.type === "URL"
                              ? "🔗 "
                              : btn.type === "PHONE_NUMBER"
                                ? "📞 "
                                : ""}
                            {btn.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="wa-message-text">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => (
                          <span style={{ display: "block", marginBottom: 4 }}>
                            {children}
                          </span>
                        ),
                        strong: ({ children }) => <strong>{children}</strong>,
                        em: ({ children }) => <em>{children}</em>,
                      }}
                    >
                      {msg.message}
                    </ReactMarkdown>
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
          placeholder={
            blockReason === "NO_USER_REPLY"
              ? "User hasn't replied yet. Send a template."
              : blockReason === "WINDOW_EXPIRED"
                ? "24-hour window expired. Send a template."
                : blockReason === "TEMPLATE_ONLY_WAITING_FOR_USER"
                  ? "Waiting for user reply…"
                  : "Type a message…"
          }
        />

        <button disabled={isSending} onClick={sendMessage}>
          {isSending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
