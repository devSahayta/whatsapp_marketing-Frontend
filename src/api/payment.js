//src/api/payment.js

import api from "./apiClient";

export const getPlans = () => api.get("/api/payment/plans");

export const createOrder = (planId, userId) =>
  api.post("/api/payment/create-order", { planId, userId });

export const verifyPayment = (data) => api.post("/api/payment/verify", data);

export const getSubscriptionStatus = (userId) =>
  api.get("/api/payment/status", { params: { userId } });

// kind: "billing" (plan payments + credit purchases) | "usage" (AI Assistant
// deductions) | "all". The split is done by the server before paging.
export const getPaymentLogs = (
  userId,
  { page = 1, pageSize = 20, kind = "all" } = {},
) => api.get("/api/payment/logs", { params: { userId, page, pageSize, kind } });

// type: "subscription" | "credits" — matches the backend route and the
// `category` field returned by getPaymentLogs ("subscription" or "purchase").
// Returns the raw PDF as a blob so the caller can trigger a browser download.
export const downloadInvoice = (type, id, userId) =>
  api.get(`/api/payment/invoice/${type}/${id}`, {
    params: { userId },
    responseType: "blob",
  });

export const createCardAuthOrder = (userId) =>
  api.post("/api/payment/payment-method/card-auth/order", { userId });

export const verifyCardAuthorization = (payload) =>
  api.post("/api/payment/payment-method/card-auth/verify", payload);

export const listPaymentMethods = (userId) =>
  api.get("/api/payment/payment-methods", { params: { userId } });

export const setDefaultPaymentMethod = (userId, paymentMethodId) =>
  api.post("/api/payment/payment-method/set-default", {
    userId,
    paymentMethodId,
  });

export const deletePaymentMethod = (userId, paymentMethodId) =>
  api.post("/api/payment/payment-method/delete", { userId, paymentMethodId });

// One-click subscribe/resubscribe using the saved default card — no
// Razorpay popup. Works for a brand-new subscriber (no subscription row
// yet) or someone resubscribing after a lapse; activateSubscription() on
// the backend handles extend-vs-restart-vs-create automatically.
export const subscribeWithSavedMethod = (userId, planId) =>
  api.post("/api/subscription/subscribe-with-saved-method", {
    userId,
    planId,
  });
