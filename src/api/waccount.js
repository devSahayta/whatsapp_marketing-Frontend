// src/api/waccount.js
import api from "./apiClient";

export const fetchWhatsappAccount = (userId) =>
  api.get(`/api/waccount/get-waccount?user_id=${userId}`);
