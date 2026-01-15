

import React, { useEffect, useState } from "react";

// WhatsApp style time formatter
const formatTime = (timestamp) => {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (isYesterday) return "Yesterday";

  return date.toLocaleDateString([], { day: "2-digit", month: "short" });
};

export default function ChatList({ eventId, onSelectChat }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  if (!eventId) return;

  let intervalId;

  const fetchChats = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/events/${eventId}/chats`
      );
      const data = await res.json();

      if (data.ok) {
        const sorted = data.chats.sort(
          (a, b) => new Date(b.last_message_at) - new Date(a.last_message_at)
        );
        setChats(sorted);
      }
    } catch (err) {
      console.error("Error fetching chats:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  fetchChats();

  // 🔁 Auto refresh every 7 sec
  intervalId = setInterval(fetchChats, 7000);

  return () => clearInterval(intervalId);
}, [eventId]);

  if (loading) return <p className="loading">Loading chats...</p>;

  return (
    <div className="wa-chatlist">
      <div className="wa-chatlist-header">Chats</div>

      {chats.map((c) => (
        <div
          key={c.chat_id}
          className="wa-chatlist-item"
          onClick={() => onSelectChat(c.chat_id, c)}
        >
          {/* Avatar */}
          <div className="wa-avatar">
            {c.person_name?.charAt(0).toUpperCase()}
          </div>

          {/* Chat Info */}
          <div className="wa-chat-info">
            <div className="wa-chat-top">
              <span className="wa-chat-name">{c.person_name}</span>
              <span className="wa-chat-time">
                {formatTime(c.last_message_at)}
              </span>
            </div>

            <div className="wa-chat-message">
              {c.last_message || "No messages yet"}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
