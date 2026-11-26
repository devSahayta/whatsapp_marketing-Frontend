//src/api/credits.js

import api from "./apiClient";

export const getCreditPricing = () => api.get("/api/credits/pricing");

export const getCreditBalance = (userId) => api.get(`/api/credits/${userId}`);

export const createCreditOrder = ({ userId, credits, packageId }) =>
  api.post("/api/credits/create-order", { userId, credits, packageId });

export const verifyCreditPurchase = (data) =>
  api.post("/api/credits/verify", data);

// One-click purchase using the user's saved default card — no Razorpay
// popup, no OTP. Backend charges the saved token directly.
export const purchaseWithSavedMethod = ({ userId, credits, packageId }) =>
  api.post("/api/credits/purchase-with-saved-method", {
    userId,
    credits,
    packageId,
  });
