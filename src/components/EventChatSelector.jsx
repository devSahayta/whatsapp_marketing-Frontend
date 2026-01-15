"use client";

import React, { useEffect, useState } from "react";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import "../styles/chat.css"; // keep your styling

export default function EventChatSelector({ onEventSelect }) {
  const { user, isAuthenticated, isLoading: authLoading } = useKindeAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔄 Fetch events of logged-in user
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      fetchEvents(user.id);
    }
  }, [authLoading, isAuthenticated, user]);

  const fetchEvents = async (userId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/events?user_id=${userId}`
      );

      if (!response.ok) throw new Error("Failed to fetch events");

      const data = await response.json();
      setEvents(data); // backend returns array
    } catch (err) {
      console.error("❌ Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="event-loading">Loading events...</p>;
  }

  return (
    <div className="event-select-wrapper">
      <label className="event-label">Select Event:</label>

      <select
        className="event-select-box"
        onChange={(e) => onEventSelect(e.target.value)}
        defaultValue=""
      >
        <option value="" disabled>
          Choose Event
        </option>

        {events.map((ev) => (
          <option key={ev.event_id} value={ev.event_id}>
            {ev.event_name}
          </option>
        ))}
      </select>
    </div>
  );
}
