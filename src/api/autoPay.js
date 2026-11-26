//src/api/autoPay.js

import api from "./apiClient";

export const getAutoPaySettings = (userId) => api.get(`/api/autopay/${userId}`);

export const updateAutoPaySettings = (
  userId,
  { enabled, lowCreditThreshold, reloadCredits },
) =>
  api.post(`/api/autopay/${userId}`, {
    enabled,
    lowCreditThreshold,
    reloadCredits,
  });
