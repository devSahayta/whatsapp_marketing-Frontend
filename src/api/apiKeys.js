// src/api/apiKeys.js
import api from "./apiClient";

export const listApiKeys = (accountId) => {
  const url = accountId
    ? `/api/apikeys?account_id=${accountId}`
    : `/api/apikeys`;
  return api.get(url);
};

export const createApiKey = (payload) => api.post("/api/apikeys", payload);

export const updateApiKey = (keyId, payload) =>
  api.patch(`/api/apikeys/${keyId}`, payload);

export const revokeApiKey = (keyId) =>
  api.post(`/api/apikeys/${keyId}/revoke`);

export const deleteApiKey = (keyId) => api.delete(`/api/apikeys/${keyId}`);

export const getUsageLogs = (params = {}) => {
  const search = new URLSearchParams();
  if (params.key_id) search.set("key_id", params.key_id);
  if (params.limit) search.set("limit", params.limit);
  if (params.offset) search.set("offset", params.offset);
  const qs = search.toString();
  return api.get(`/api/apikeys/logs${qs ? `?${qs}` : ""}`);
};
