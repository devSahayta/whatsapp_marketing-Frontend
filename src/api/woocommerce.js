import api from "./apiClient";

export const connectWooStore = (data) =>
  api.post("/api/woocommerce/connect", data);
export const getWooConnections = () => api.get("/api/woocommerce/connections");
export const disconnectWooStore = (id) =>
  api.delete(`/api/woocommerce/connections/${id}`);
export const getWooAutomations = () => api.get("/api/woocommerce/automations");
export const createWooAutomation = (data) =>
  api.post("/api/woocommerce/automations", data);
export const updateWooAutomation = (id, data) =>
  api.patch(`/api/woocommerce/automations/${id}`, data);
export const deleteWooAutomation = (id) =>
  api.delete(`/api/woocommerce/automations/${id}`);
export const getWooLogs = () => api.get("/api/woocommerce/logs");
export const getWaAccountId = () => api.get("/api/woocommerce/account-id");

// ✅ NEW: Gets a Meta header_handle using a placeholder image
// Used by Template Guide when creating IMAGE header templates
export const getPlaceholderHandle = () =>
  api.post("/api/woocommerce/placeholder-handle");

export const getCartRecoveryStats = () =>
  api.get("/api/woocommerce/cart-recovery/stats");

export const getCartRecoveryLogs = () =>
  api.get("/api/woocommerce/cart-recovery/logs");
