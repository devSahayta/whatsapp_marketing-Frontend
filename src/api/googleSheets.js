import api from "./apiClient";

export const connectGoogle = () => api.get("/api/integrations/google/connect");

export const disconnectGoogle = () =>
  api.delete("/api/integrations/google/disconnect");

export const fetchGooglePickerToken = () =>
  api.get("/api/integrations/google/picker-token");

export const importFromGoogleSheet = (payload) =>
  api.post("/api/integrations/google/import-contacts", payload);

export const exportCampaignToGoogleSheet = (payload) =>
  api.post("/api/integrations/google/export-campaign", payload);

export const syncContactsFromGoogleSheet = (payload) =>
  api.post("/api/integrations/google/sync-contacts", payload);
