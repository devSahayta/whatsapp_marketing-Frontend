import api from "./apiClient";

export const getCreditPricing = () => api.get("/api/credits/pricing");

export const getCreditBalance = (userId) => api.get(`/api/credits/${userId}`);

export const createCreditOrder = ({ userId, credits, packageId }) =>
  api.post("/api/credits/create-order", { userId, credits, packageId });

export const verifyCreditPurchase = (data) =>
  api.post("/api/credits/verify", data);
