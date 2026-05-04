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

export default function ChatList({ userId, onSelectChat }) {
  const [chats, setChats] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const loaderRef = useRef(null);
  const pollingRef = useRef(null);
  const listRef = useRef(null); // add this with your other refs

  const fetchChats = useCallback(
    async (offset = 0, replace = false) => {
      if (!userId) return;
      offset === 0 && replace
        ? setLoading(true)
        : offset > 0
          ? setLoadingMore(true)
          : null;

      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/chats?user_id=${userId}&limit=${PAGE_SIZE}&offset=${offset}`,
        );
        const data = await res.json();
        if (!data.ok) return;

        setTotal(data.total || 0);

        if (replace) {
          // Called on initial load — full replace is fine, user is at top
          setChats(data.chats);
        } else if (offset > 0) {
          // Infinite scroll — append new page
          setChats((prev) => {
            const existingIds = new Set(prev.map((c) => c.chat_id));
            const newChats = data.chats.filter(
              (c) => !existingIds.has(c.chat_id),
            );
            return [...prev, ...newChats];
          });
        } else {
          // Polling — save scroll position BEFORE state update
          const scrollEl = listRef.current;
          const savedScrollTop = scrollEl?.scrollTop || 0;

          setChats((prev) => {
            const incoming = data.chats;
            const incomingMap = new Map(incoming.map((c) => [c.chat_id, c]));
            const updated = prev.map((c) => incomingMap.get(c.chat_id) || c);
            const existingIds = new Set(prev.map((c) => c.chat_id));
            const brandNew = incoming.filter(
              (c) => !existingIds.has(c.chat_id),
            );
            return [...brandNew, ...updated];
          });

          // Restore scroll position after React re-renders
          if (scrollEl && savedScrollTop > 0) {
            requestAnimationFrame(() => {
              scrollEl.scrollTop = savedScrollTop;
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
    [userId],
  );

  useEffect(() => {
    if (!userId) return;
    setChats([]);
    fetchChats(0, true);
  }, [userId, fetchChats]);

  useEffect(() => {
    if (!userId) return;
    pollingRef.current = setInterval(() => fetchChats(0, false), 7000);
    return () => clearInterval(pollingRef.current);
  }, [userId, fetchChats]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && chats.length < total && !loadingMore)
          fetchChats(chats.length, false);
      },
      { threshold: 0.1 },
    );
    if (loaderRef.current) obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [chats.length, total, loadingMore, fetchChats]);

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

  if (loading) {
    return (
      <div className="wa-chatlist-loading">
        <div className="wa-loading-spinner" />
        <p style={{ fontSize: 13 }}>Loading conversations…</p>
      </div>
    );
  }

  return (
    <div className="wa-chatlist-inner">
      {/* Header */}
      <div className="wa-chatlist-header">
        <span className="wa-chatlist-title">Messages</span>
        <span className="wa-chatlist-count">{total.toLocaleString()}</span>
      </div>

      {/* Search */}
      <div className="wa-search-box">
        {/* <span className="wa-search-icon"></span> */}
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

      {/* List */}
      <div className="wa-chatlist-items" ref={listRef}>
        {filtered.length === 0 ? (
          <p className="wa-empty-search">No conversations found</p>
        ) : (
          filtered.map((c) => {
            const badge = modeBadge(c.mode);
            const initial = (c.person_name || c.phone_number || "?")
              .charAt(0)
              .toUpperCase();
            const preview = c.last_message || "No messages yet";

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

        {!search && chats.length < total && (
          <div ref={loaderRef} className="wa-load-more">
            {loadingMore
              ? "Loading…"
              : `Showing ${chats.length} of ${total.toLocaleString()}`}
          </div>
        )}
      </div>
    </div>
  );
}
