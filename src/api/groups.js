// src/api/groups.js
import api from "./apiClient";

export const fetchGroups = (userId) => api.get(`/api/groups?user_id=${userId}`);

export const fetchGroupParticipants = (group_id, userId) =>
  api.get(`/api/groups/${group_id}/participants?user_id=${userId}`);
