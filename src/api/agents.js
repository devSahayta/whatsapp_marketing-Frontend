// src/api/agents.js

import apiClient from "./apiClient";

export const getModelInfo = () => apiClient.get("api/agents/models");

export const createAgent = (data) => apiClient.post("api/agents", data);

export const getAgents = (userId, accountId) =>
  apiClient.get("api/agents", {
    params: { user_id: userId, account_id: accountId },
  });

export const getAgentById = (agentId) => apiClient.get(`api/agents/${agentId}`);

export const updateAgent = (agentId, data) =>
  apiClient.put(`api/agents/${agentId}`, data);

export const deleteAgent = (agentId) =>
  apiClient.delete(`api/agents/${agentId}`);

export const testAgent = (agentId, message, history = []) =>
  apiClient.post(`api/agents/${agentId}/test`, { message, history });

// ── Group creation — Step 1: preview (parse CSV, no DB write) ──────────────
// Returns { group_name, contact_count, sample, contacts[] }
export const previewGroupFromCsv = (userId, groupName, file) => {
  const form = new FormData();
  form.append("user_id", userId);
  form.append("group_name", groupName);
  form.append("file", file);
  return apiClient.post("api/agents/samvaadik/preview-group", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// ── Group creation — Step 2: confirm (create group + insert contacts) ──────
// contacts[] comes from the preview response
export const createGroupFromCsv = (userId, groupName, description, contacts) =>
  apiClient.post("api/agents/samvaadik/create-group", {
    user_id: userId,
    group_name: groupName,
    description,
    contacts,
  });

// ── Samvaadik AI Assistant ─────────────────────────────────────────────────
// Sends the full conversation history to the agentic campaign loop.
// messages: [{ role: "user" | "assistant", content: string }]
export const samvaadikChat = (userId, messages, mediaAttachment = null) =>
  apiClient.post("api/agents/samvaadik/chat", {
    user_id: userId,
    messages,
    ...(mediaAttachment && { media_attachment: mediaAttachment }),
  });
