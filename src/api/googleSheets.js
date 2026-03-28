import api from "./apiClient";

export const connectGoogle = () => api.get("/api/integrations/google/connect");

export const fetchGoogleSheets = () =>
  api.get("/api/integrations/google/sheets");

export const importFromGoogleSheet = (payload) =>
  api.post("/api/integrations/google/import-contacts", payload);

export const exportCampaignToGoogleSheet = (payload) =>
  api.post("/api/integrations/google/export-campaign", payload);
