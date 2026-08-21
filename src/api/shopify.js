import api from "./apiClient";

export const connectShopifyStore = (data) =>
  api.post("/api/shopify/connect", data);
export const getShopifyConnections = () =>
  api.get("/api/shopify/connections");
export const disconnectShopifyStore = (id) =>
  api.delete(`/api/shopify/connections/${id}`);
