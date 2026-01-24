// api/analytics.js

import api from "./apiClient";

// Fetch message analytics (your colleague's endpoint)
export const fetchMessageAnalytics = (userId, from, to) => {
  let url = `/api/analytics/message-stats?user_id=${userId}`;

  if (from && to) {
    url += `&from=${from}&to=${to}`;  
  }

  return api.get(url);
};

// Fetch overview stats (Section 1: 4 cards)
export const fetchOverviewStats = (userId, from_date, to_date) => {
  let url = `/api/analytics/overview?user_id=${userId}`;

  if (from_date) url += `&from_date=${from_date}`;
  if (to_date) url += `&to_date=${to_date}`;

  return api.get(url);
};

// Fetch groups performance (Section 2: Table)
export const fetchGroupsPerformance = (userId, from_date, to_date) => {
  let url = `/api/analytics/groups-performance?user_id=${userId}`;

  if (from_date) url += `&from_date=${from_date}`;
  if (to_date) url += `&to_date=${to_date}`;

  return api.get(url);
};

// Fetch complete dashboard (Both sections in one call) - RECOMMENDED
export const fetchDashboardAnalytics = (userId, from_date, to_date) => {
  let url = `/api/analytics/dashboard?user_id=${userId}`;

  if (from_date) url += `&from_date=${from_date}`;
  if (to_date) url += `&to_date=${to_date}`;

  return api.get(url);
};