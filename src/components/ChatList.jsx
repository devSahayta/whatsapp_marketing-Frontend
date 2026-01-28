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

export default function ChatList({ userId, onSelectChat }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    let intervalId;

    const fetchChats = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/chats?user_id=${userId}`,
        );
        const data = await res.json();

        if (data.ok) {
          setChats(data.chats);
        }
      } catch (err) {
        console.error("Error fetching chats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
    intervalId = setInterval(fetchChats, 7000);

    return () => clearInterval(intervalId);
  }, [userId]);

  if (loading) return <p className="loading">Loading chats...</p>;

  if (chats.length === 0) {
    return <p className="select-event-message">No conversations yet</p>;
  }

  return (
    <div className="wa-chatlist-items">
      {chats.map((c) => (
        <div
          key={c.chat_id}
          className="wa-chatlist-item"
          onClick={() => onSelectChat(c.chat_id, c)}
        >
          <div className="wa-avatar">
            {(c.person_name || "U").charAt(0).toUpperCase()}
          </div>

          <div className="wa-chat-info">
            <div className="wa-chat-top">
              <span className="wa-chat-name">
                {c.person_name || "Unknown User"}
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
      ))}
    </div>
  );
}
