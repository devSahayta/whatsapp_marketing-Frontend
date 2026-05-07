// components/NotificationBell.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

const POLL_INTERVAL = 15000;

const fmtTime = (ts) => {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  return new Date(ts).toLocaleDateString([], {
    day: "2-digit",
    month: "short",
  });
};

const getTypeIcon = (type, message_type) => {
  if (type === "subscription_expiry") return "⚠️";
  if (type === "order_placed") return "🛍️";
  if (message_type === "image") return "📷";
  if (message_type === "audio") return "🎵";
  if (message_type === "document") return "📄";
  if (message_type === "video") return "🎥";
  return null;
};

const AVATAR_COLORS = [
  ["#ede9ff", "#6d28d9"],
  ["#dbeafe", "#1d4ed8"],
  ["#dcfce7", "#15803d"],
  ["#fef3c7", "#b45309"],
  ["#fce7f3", "#9d174d"],
  ["#e0f2fe", "#0369a1"],
  ["#ffedd5", "#c2410c"],
  ["#f3e8ff", "#7e22ce"],
];

function avatarColors(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

/* ── Notification Panel (shared between desktop + mobile) ───── */
function NotificationPanel({
  notifications,
  unreadCount,
  tab,
  setTab,
  isLoading,
  onMarkAllRead,
  onClearRead,
  onClickItem,
  onOpenChat,
}) {
  const displayed =
    tab === "unread" ? notifications.filter((n) => !n.is_read) : notifications;

  return (
    <>
      {/* Header */}
      <div className="nb-head">
        <div className="nb-head-top">
          <span className="nb-title">Notifications</span>
          {unreadCount > 0 && (
            <span className="nb-chip">{unreadCount} new</span>
          )}
        </div>

        {/* Tabs */}
        <div className="nb-tabs">
          {[
            { key: "all", label: "All", count: notifications.length },
            { key: "unread", label: "Unread", count: unreadCount, red: true },
          ].map((t) => (
            <button
              key={t.key}
              className={`nb-tab ${tab === t.key ? "nb-tab--on" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              {t.count > 0 && (
                <span
                  className={`nb-tab-pill ${t.red && tab !== t.key ? "nb-tab-pill--red" : ""}`}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Quick actions */}
        {notifications.length > 0 && (
          <div className="nb-head-actions">
            {unreadCount > 0 && (
              <button
                className="nb-act"
                onClick={onMarkAllRead}
                disabled={isLoading}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Mark all read
              </button>
            )}
            <button className="nb-act nb-act--danger" onClick={onClearRead}>
              Clear read
            </button>
          </div>
        )}
      </div>

      {/* List */}
      <div className="nb-list">
        {displayed.length === 0 ? (
          <div className="nb-empty">
            <div className="nb-empty-ico">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            </div>
            <p className="nb-empty-title">
              {tab === "unread"
                ? "You're all caught up!"
                : "No notifications yet"}
            </p>
            <p className="nb-empty-sub">
              {tab === "unread"
                ? "All notifications have been read"
                : "New WhatsApp messages will appear here"}
            </p>
          </div>
        ) : (
          displayed.map((n) => {
            const name = n.person_name || n.phone_number || "Unknown";
            const icon = getTypeIcon(n.type, n.message_type);
            const [bg, fg] = avatarColors(name);

            return (
              <div
                key={n.notification_id}
                className={`nb-item ${!n.is_read ? "nb-item--unread" : ""}`}
                onClick={() => onClickItem(n)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && onClickItem(n)}
              >
                {!n.is_read && (
                  <span className="nb-item-dot" aria-hidden="true" />
                )}

                <div
                  className="nb-avatar"
                  style={{ background: bg, color: fg }}
                >
                  {name.charAt(0).toUpperCase()}
                  {icon && <span className="nb-avatar-ico">{icon}</span>}
                </div>

                <div className="nb-body">
                  <div className="nb-body-top">
                    <span className="nb-name">{name}</span>
                    <span className="nb-time">{fmtTime(n.created_at)}</span>
                  </div>
                  <p className="nb-preview">
                    {n.message_preview || "Sent a message"}
                  </p>
                  <span
                    className={`nb-tag nb-tag--${n.type || "incoming_message"}`}
                  >
                    {n.type === "incoming_message"
                      ? "WhatsApp"
                      : n.type === "order_placed"
                        ? "Order"
                        : n.type === "subscription_expiry"
                          ? "Subscription"
                          : "Alert"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {displayed.length > 0 && (
        <div className="nb-footer">
          <button className="nb-footer-btn" onClick={onOpenChat}>
            Open Chat Dashboard
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}

/* ── Main Component ─────────────────────────────────────────── */
export default function NotificationBell({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tab, setTab] = useState("all");
  const [isMobile, setIsMobile] = useState(false);

  const bellRef = useRef(null);
  const panelRef = useRef(null);
  const pollRef = useRef(null);
  const navigate = useNavigate();

  /* ── Responsive check ──────────────────────────────────────── */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* ── Desktop panel position ────────────────────────────────── */
  const [panelPos, setPanelPos] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (isOpen && !isMobile && bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect();
      setPanelPos({
        top: rect.bottom + window.scrollY + 10,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isOpen, isMobile]);

  /* ── Fetch ──────────────────────────────────────────────────── */
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/notifications?user_id=${userId}`,
      );
      const data = await res.json();
      if (data.ok) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (e) {
      console.error("notif:", e);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) fetchNotifications();
  }, [userId, fetchNotifications]);

  useEffect(() => {
    if (!userId) return;
    pollRef.current = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [userId, fetchNotifications]);

  /* ── Close on outside click (desktop only) ─────────────────── */
  useEffect(() => {
    if (!isOpen || isMobile) return;
    const close = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        bellRef.current &&
        !bellRef.current.contains(e.target)
      )
        setIsOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [isOpen, isMobile]);

  /* ── Lock body scroll when mobile overlay open ─────────────── */
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobile, isOpen]);

  /* ── Actions ────────────────────────────────────────────────── */
  const markAllRead = async () => {
    if (!userId || unreadCount === 0) return;
    setIsLoading(true);
    try {
      await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/notifications/read-all`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId }),
        },
      );
      setNotifications((p) => p.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const clearRead = async () => {
    try {
      await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/notifications/clear`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId }),
        },
      );
      setNotifications((p) => p.filter((n) => !n.is_read));
    } catch (e) {
      console.error(e);
    }
  };

  const handleClickItem = async (n) => {
    if (!n.is_read) {
      try {
        await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/notifications/${n.notification_id}/read`,
          { method: "PATCH" },
        );
        setNotifications((p) =>
          p.map((x) =>
            x.notification_id === n.notification_id
              ? { ...x, is_read: true }
              : x,
          ),
        );
        setUnreadCount((p) => Math.max(0, p - 1));
      } catch (e) {
        console.error(e);
      }
    }
    if (n.chat_id) {
      setIsOpen(false);
      navigate("/chat", { state: { openChatId: n.chat_id } });
    }
  };

  const handleOpenChat = () => {
    setIsOpen(false);
    navigate("/chat");
  };

  const panelProps = {
    notifications,
    unreadCount,
    tab,
    setTab,
    isLoading,
    onMarkAllRead: markAllRead,
    onClearRead: clearRead,
    onClickItem: handleClickItem,
    onOpenChat: handleOpenChat,
  };

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <>
      {/* Bell button */}
      <div className="nb-wrap">
        <button
          ref={bellRef}
          className={`nb-bell ${isOpen ? "nb-bell--open" : ""}`}
          onClick={() => setIsOpen((v) => !v)}
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        >
          <svg
            className="nb-bell-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <span className="nb-bell-ring" aria-hidden="true" />
          )}
          {unreadCount > 0 && (
            <span className="nb-badge" aria-hidden="true">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Portal — renders outside navbar, always on top */}
      {isOpen &&
        createPortal(
          isMobile ? (
            /* ── MOBILE — full overlay + bottom sheet ─────────── */
            <div className="nb-overlay" onClick={() => setIsOpen(false)}>
              <div className="nb-sheet" onClick={(e) => e.stopPropagation()}>
                {/* Drag handle */}
                <div className="nb-sheet-handle" />
                <NotificationPanel {...panelProps} />
              </div>
            </div>
          ) : (
            /* ── DESKTOP — floating dropdown ──────────────────── */
            <div
              ref={panelRef}
              className="nb-panel"
              style={{ top: panelPos.top, right: panelPos.right }}
            >
              <NotificationPanel {...panelProps} />
            </div>
          ),
          document.body,
        )}
    </>
  );
}
