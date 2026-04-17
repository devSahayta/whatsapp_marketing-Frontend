import React, { useEffect, useState, useRef, useCallback } from "react";

const PAGE_SIZE = 100;

const formatTime = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (isToday)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { day: "2-digit", month: "short" });
};

export default function ChatList({ userId, onSelectChat }) {
  const [chats, setChats] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChatId, setSelectedChatId] = useState(null);
  const loaderRef = useRef(null);
  const pollingRef = useRef(null);

  const fetchChats = useCallback(
    async (currentOffset = 0, replace = false) => {
      if (!userId) return;
      if (currentOffset === 0) setLoading(true);
      else setLoadingMore(true);

      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/chats?user_id=${userId}&limit=${PAGE_SIZE}&offset=${currentOffset}`,
        );
        const data = await res.json();

        if (data.ok) {
          setTotal(data.total || 0);
          setChats((prev) => (replace ? data.chats : [...prev, ...data.chats]));
        }
      } catch (err) {
        console.error("Error fetching chats:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [userId],
  );

  // Initial load
  useEffect(() => {
    if (!userId) return;
    setChats([]);
    setOffset(0);
    fetchChats(0, true);
  }, [userId]);

  // Poll for new/updated chats (first page only — they're sorted by last_message_at desc)
  useEffect(() => {
    if (!userId) return;
    pollingRef.current = setInterval(() => fetchChats(0, true), 7000);
    return () => clearInterval(pollingRef.current);
  }, [userId, fetchChats]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && chats.length < total && !loadingMore) {
          const nextOffset = chats.length;
          setOffset(nextOffset);
          fetchChats(nextOffset, false);
        }
      },
      { threshold: 0.1 },
    );

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [chats.length, total, loadingMore, fetchChats]);

  const filteredChats = searchQuery.trim()
    ? chats.filter((c) => {
        const q = searchQuery.toLowerCase();
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
        <p>Loading chats...</p>
      </div>
    );
  }

  return (
    <div className="wa-chatlist-inner">
      {/* Header with count */}
      <div className="wa-chatlist-header">
        <span className="wa-chatlist-title">Chats</span>
        <span className="wa-chatlist-count">{total.toLocaleString()}</span>
      </div>

      {/* Search */}
      <div className="wa-search-box">
        <input
          type="text"
          placeholder="Search by name, number or message..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && <button onClick={() => setSearchQuery("")}>✕</button>}
      </div>

      {/* Chat items */}
      <div className="wa-chatlist-items">
        {filteredChats.length === 0 ? (
          <p className="wa-empty-search">No chats found</p>
        ) : (
          filteredChats.map((c) => (
            <div
              key={c.chat_id}
              className={`wa-chatlist-item ${selectedChatId === c.chat_id ? "active" : ""}`}
              onClick={() => {
                setSelectedChatId(c.chat_id);
                onSelectChat(c.chat_id, c);
              }}
            >
              <div className="wa-avatar">
                {(c.person_name || "U").charAt(0).toUpperCase()}
              </div>
              <div className="wa-chat-info">
                <div className="wa-chat-top">
                  <span className="wa-chat-name">
                    {c.person_name || "Unknown"}
                  </span>
                  <span className="wa-chat-time">
                    {formatTime(c.last_message_at)}
                  </span>
                </div>
                <div className="wa-chat-message">
                  {c.last_message || "No messages yet"}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Infinite scroll trigger */}
        {!searchQuery && chats.length < total && (
          <div ref={loaderRef} className="wa-load-more">
            {loadingMore ? (
              <span>Loading more chats...</span>
            ) : (
              <span>
                {chats.length} of {total.toLocaleString()} loaded
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
