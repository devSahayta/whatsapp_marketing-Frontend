import api from "./apiClient";

export const fetchIntegrationStatus = () => api.get("/api/integrations/status");
