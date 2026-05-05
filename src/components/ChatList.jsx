// components/ChatList.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";

const PAGE_SIZE = 100;

const fmtTime = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { day: "2-digit", month: "short" });
};

const modeBadge = (mode) => {
  const m = (mode || "AI").toUpperCase();
  if (m === "BOT") return { label: "BOT", cls: "bot" };
  if (m === "MANUAL") return { label: "Live", cls: "manual" };
  return { label: "AI", cls: "ai" };
};

const FILTERS = [
  { key: "all", label: "All", icon: "💬" },
  { key: "incoming", label: "Incoming", icon: "📥" },
  { key: "outgoing", label: "Outgoing", icon: "📤" },
  { key: "bot", label: "Bot Active", icon: "🤖" },
];

/* ── Info content ─────────────────────────────────────────────── */
const FILTER_INFO = [
  {
    label: "All",
    desc: "Shows every conversation from all your contacts — no filter applied. This is your default view.",
  },
  {
    label: "Incoming",
    desc: "Shows only chats where the customer sent the last message. These are conversations waiting for your reply.",
  },
  {
    label: "Outgoing",
    desc: "Shows only chats where you or the bot sent the last message. The customer hasn't replied yet.",
  },
  {
    label: "Bot Active",
    desc: "Shows only chats currently being handled by the chatbot or AI agent. No human has taken over yet.",
  },
];

const MODE_INFO = [
  {
    label: "AI Mode",
    cls: "ai",
    desc: "The AI agent is handling this conversation. It reads the customer's message and replies automatically using AI models.",
  },
  {
    label: "BOT Mode",
    cls: "bot",
    desc: "A rule-based chatbot flow is active. It follows a fixed script — keyword triggers, menus, and automated replies.",
  },
  {
    label: "Live Support",
    cls: "manual",
    desc: "A human agent has taken over this chat. The bot is paused and all replies must be sent manually by your team.",
  },
];

/* ── Reusable Info Popover ────────────────────────────────────── */
function InfoPopover({ items, title, onClose }) {
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [onClose]);

  return (
    <div className="wa-info-overlay" onClick={onClose}>
      <div
        className="wa-info-popover"
        ref={ref}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="wa-info-popover-header">
          <span className="wa-info-popover-title">{title}</span>
          <button className="wa-info-popover-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="wa-info-popover-body">
          {items.map((item, i) => (
            <div key={i} className="wa-info-popover-item">
              <div className="wa-info-popover-item-top">
                <span className="wa-info-popover-item-icon">{item.icon}</span>
                <span className={`wa-info-label-badge ${item.cls || ""}`}>
                  {item.label}
                </span>
              </div>
              <p className="wa-info-popover-item-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────────── */
export default function ChatList({ userId, onSelectChat }) {
  const [chats, setChats] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showFilterInfo, setShowFilterInfo] = useState(false);
  const [showModeInfo, setShowModeInfo] = useState(false);

  const loaderRef = useRef(null);
  const pollingRef = useRef(null);
  const listRef = useRef(null);

  /* ── Fetch ──────────────────────────────────────────────────── */
  const fetchChats = useCallback(
    async (offset = 0, replace = false, filter) => {
      if (!userId) return;
      const currentFilter = filter ?? activeFilter;

      if (offset === 0 && replace) setLoading(true);
      else if (offset > 0) setLoadingMore(true);

      try {
        const url = new URL(`${import.meta.env.VITE_BACKEND_URL}/api/chats`);
        url.searchParams.set("user_id", userId);
        url.searchParams.set("limit", PAGE_SIZE);
        url.searchParams.set("offset", offset);
        url.searchParams.set("filter", currentFilter);

        const res = await fetch(url.toString());
        const data = await res.json();
        if (!data.ok) return;

        setTotal(data.total || 0);

        if (replace) {
          setChats(data.chats);
        } else if (offset > 0) {
          setChats((prev) => {
            const existingIds = new Set(prev.map((c) => c.chat_id));
            return [
              ...prev,
              ...data.chats.filter((c) => !existingIds.has(c.chat_id)),
            ];
          });
        } else {
          // Silent polling — save and restore scroll
          const scrollEl = listRef.current;
          const savedTop = scrollEl?.scrollTop || 0;

          setChats((prev) => {
            const incomingMap = new Map(data.chats.map((c) => [c.chat_id, c]));
            const updated = prev.map((c) => incomingMap.get(c.chat_id) || c);
            const existingIds = new Set(prev.map((c) => c.chat_id));
            const brandNew = data.chats.filter(
              (c) => !existingIds.has(c.chat_id),
            );
            return [...brandNew, ...updated];
          });

          if (scrollEl && savedTop > 0) {
            requestAnimationFrame(() => {
              scrollEl.scrollTop = savedTop;
            });
          }
        }
      } catch (e) {
        console.error("fetch chats:", e);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [userId, activeFilter],
  );

  useEffect(() => {
    if (!userId) return;
    setChats([]);
    setTotal(0);
    fetchChats(0, true, activeFilter);
  }, [userId, activeFilter]); // eslint-disable-line

  useEffect(() => {
    if (!userId) return;
    pollingRef.current = setInterval(
      () => fetchChats(0, false, activeFilter),
      7000,
    );
    return () => clearInterval(pollingRef.current);
  }, [userId, activeFilter, fetchChats]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && chats.length < total && !loadingMore)
          fetchChats(chats.length, false, activeFilter);
      },
      { threshold: 0.1 },
    );
    if (loaderRef.current) obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [chats.length, total, loadingMore, activeFilter, fetchChats]);

  const handleFilterChange = (key) => {
    if (key === activeFilter) return;
    setActiveFilter(key);
  };

  const filtered = search.trim()
    ? chats.filter((c) => {
        const q = search.toLowerCase();
        return (
          c.person_name?.toLowerCase().includes(q) ||
          c.phone_number?.includes(q) ||
          c.last_message?.toLowerCase().includes(q)
        );
      })
    : chats;

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className="wa-chatlist-inner">
      {/* Header */}
      <div className="wa-chatlist-header">
        <span className="wa-chatlist-title">Messages</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="wa-chatlist-count">{total.toLocaleString()}</span>
          {/* Mode info icon */}
          <button
            className="wa-info-btn"
            onClick={() => setShowModeInfo(true)}
            title="What do the mode labels mean?"
          >
            <span>i</span>
          </button>
        </div>
      </div>

      {/* Filter tabs row */}
      <div className="wa-filter-row">
        <div className="wa-filter-tabs">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`wa-filter-tab ${activeFilter === f.key ? "active" : ""}`}
              onClick={() => handleFilterChange(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        {/* Filter info icon */}
        <button
          className="wa-info-btn"
          onClick={() => setShowFilterInfo(true)}
          title="What do these filters mean?"
        >
          <span>i</span>
        </button>
      </div>

      {/* Search */}
      <div className="wa-search-box">
        <input
          type="text"
          placeholder="Search conversations…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="wa-search-clear" onClick={() => setSearch("")}>
            ✕
          </button>
        )}
      </div>

      {/* Chat list */}
      <div className="wa-chatlist-items" ref={listRef}>
        {loading ? (
          <div className="wa-list-center">
            <div className="wa-loading-spinner" />
            <p style={{ fontSize: 13, color: "var(--t-muted)" }}>Loading…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="wa-list-center">
            <div style={{ fontSize: 36, marginBottom: 8 }}>
              {FILTERS.find((f) => f.key === activeFilter)?.icon}
            </div>
            <p
              style={{ fontSize: 13, color: "var(--t-muted)", fontWeight: 500 }}
            >
              {activeFilter === "all"
                ? "No conversations yet"
                : `No ${FILTERS.find((f) => f.key === activeFilter)?.label.toLowerCase()} messages`}
            </p>
          </div>
        ) : (
          filtered.map((c) => {
            const badge = modeBadge(c.mode);
            const initial = (c.person_name || c.phone_number || "?")
              .charAt(0)
              .toUpperCase();
            const preview = c.last_message || "No messages yet";
            const isIncoming = c.last_sender_type === "user";

            return (
              <div
                key={c.chat_id}
                className={`wa-chatlist-item ${selectedId === c.chat_id ? "active" : ""}`}
                onClick={() => {
                  setSelectedId(c.chat_id);
                  onSelectChat(c.chat_id, c);
                }}
              >
                <div className="wa-avatar">{initial}</div>

                <div className="wa-chat-info">
                  <div className="wa-chat-top">
                    <span className="wa-chat-name">
                      {c.person_name || c.phone_number || "Unknown"}
                    </span>
                    <span className="wa-chat-time">
                      {fmtTime(c.last_message_at)}
                    </span>
                  </div>
                  <div className="wa-chat-bottom">
                    <span
                      className="wa-dir-arrow"
                      style={{ color: isIncoming ? "#10b981" : "#7c3aed" }}
                      title={
                        isIncoming
                          ? "Customer sent last message"
                          : "You/Bot sent last message"
                      }
                    >
                      {isIncoming ? "↙" : "↗"}
                    </span>
                    <span className="wa-chat-message">{preview}</span>
                    <span className={`wa-mode-badge ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {!search && !loading && chats.length < total && (
          <div ref={loaderRef} className="wa-load-more">
            {loadingMore
              ? "Loading more…"
              : `${chats.length} of ${total.toLocaleString()} loaded`}
          </div>
        )}
      </div>

      {/* Filter info popover */}
      {showFilterInfo && (
        <InfoPopover
          title="What do these filters mean?"
          items={FILTER_INFO}
          onClose={() => setShowFilterInfo(false)}
        />
      )}

      {/* Mode info popover */}
      {showModeInfo && (
        <InfoPopover
          title="What do the mode labels mean?"
          items={MODE_INFO}
          onClose={() => setShowModeInfo(false)}
        />
      )}
    </div>
  );
}
