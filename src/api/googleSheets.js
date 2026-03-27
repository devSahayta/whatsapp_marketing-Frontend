import api from "./apiClient";

// 🔗 Connect Google
export const connectGoogle = (userId) =>
  api.get(`/api/integrations/google/connect?user_id=${userId}`);

// 📥 Import contacts from sheet
export const importFromGoogleSheet = (payload) =>
  api.post("/api/integrations/google/import-contacts", payload);
