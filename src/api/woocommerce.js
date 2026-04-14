import api from "./apiClient";

export const connectWooStore = (data) =>
  api.post("/api/woocommerce/connect", data);
export const getWooConnections = () => api.get("/api/woocommerce/connections");
export const disconnectWooStore = (id) =>
  api.delete(`/api/woocommerce/connections/${id}`);

// ✅ Now accepts optional connection_id to filter by store
export const getWooAutomations = (connection_id) =>
  api.get(
    `/api/woocommerce/automations${connection_id ? `?connection_id=${connection_id}` : ""}`,
  );

export const createWooAutomation = (data) =>
  api.post("/api/woocommerce/automations", data);
export const updateWooAutomation = (id, data) =>
  api.patch(`/api/woocommerce/automations/${id}`, data);
export const deleteWooAutomation = (id) =>
  api.delete(`/api/woocommerce/automations/${id}`);

// ✅ Now accepts optional connection_id to filter by store
export const getWooLogs = (connection_id) =>
  api.get(
    `/api/woocommerce/logs${connection_id ? `?connection_id=${connection_id}` : ""}`,
  );

export const getWaAccountId = () => api.get("/api/woocommerce/account-id");

export const getPlaceholderHandle = () =>
  api.post("/api/woocommerce/placeholder-handle");

export const getCartRecoveryStats = () =>
  api.get("/api/woocommerce/cart-recovery/stats");

export const getCartRecoveryLogs = () =>
  api.get("/api/woocommerce/cart-recovery/logs");
