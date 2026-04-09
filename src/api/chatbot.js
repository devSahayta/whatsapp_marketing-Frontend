// api/chatbot.js

import api from "./apiClient";

// ── Flows ────────────────────────────────────────────────────────────────────

export const getFlows = (userId, accountId) => {
  let url = `/api/chatbot/flows?user_id=${userId}`;
  if (accountId) url += `&account_id=${accountId}`;
  return api.get(url);
};

export const getFlowById = (flowId) =>
  api.get(`/api/chatbot/flows/${flowId}`);

export const createFlow = (data) =>
  api.post("/api/chatbot/flows", data);

export const updateFlow = (flowId, data) =>
  api.put(`/api/chatbot/flows/${flowId}`, data);

export const deleteFlow = (flowId) =>
  api.delete(`/api/chatbot/flows/${flowId}`);

export const saveFlow = (flowId, nodes, edges) =>
  api.post(`/api/chatbot/flows/${flowId}/save`, { nodes, edges });

// ── Templates helper ─────────────────────────────────────────────────────────

export const getTemplatesForAccount = (accountId) =>
  api.get(`/api/chatbot/templates?account_id=${accountId}`);

// ── Sessions ─────────────────────────────────────────────────────────────────

export const getFlowSessions = (flowId, status) => {
  let url = `/api/chatbot/flows/${flowId}/sessions`;
  if (status) url += `?status=${status}`;
  return api.get(url);
};
