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
