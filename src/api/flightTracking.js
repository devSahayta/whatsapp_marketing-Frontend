import api from "./apiClient";

export const fetchEventFlights = (eventId, userId) =>
  api.get(`/api/flight-tracking/event/${eventId}?user_id=${userId}`);

export const refreshEventFlights = (eventId, userId) =>
  api.post(`/api/flight-tracking/event/${eventId}/refresh?user_id=${userId}`);
