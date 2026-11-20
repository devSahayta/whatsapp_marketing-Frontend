import api from "./apiClient";

export const submitCustomPricingRequest = (payload) =>
  api.post("/api/custom-pricing/contact", payload);
