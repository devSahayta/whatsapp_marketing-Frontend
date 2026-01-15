// src/api/events.js
import api from "./apiClient";

export const fetchEvents = (userId) => api.get(`/api/events?user_id=${userId}`);

export const fetchEventParticipants = (event_id, userId) =>
  api.get(`/api/events/${event_id}/participants?user_id=${userId}`);
