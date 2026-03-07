import api from "./apiClient";

export const getPlans = () => api.get("/api/payment/plans");

export const createOrder = (planId, userId) =>
  api.post("/api/payment/create-order", { planId, userId });

export const verifyPayment = (data) => api.post("/api/payment/verify", data);

export const getSubscriptionStatus = (userId) =>
  api.get("/api/payment/status", { params: { userId } });
