import api from "./apiClient";

export const fetchMessageAnalytics = (userId, from, to) => {
  let url = `/api/analytics/message-stats?user_id=${userId}`;

  if (from && to) {
    url += `&from=${from}&to=${to}`;
  }

  return api.get(url);
};
