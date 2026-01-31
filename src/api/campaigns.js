// api/campaigns.js

import api from "./apiClient";

/* =====================================
   CAMPAIGN CRUD OPERATIONS
====================================== */

// Create new campaign
export const createCampaign = (data) => {
  return api.post("/api/campaigns", data);
};

// Get all campaigns for user
export const getCampaigns = (userId) => {
  return api.get(`/api/campaigns?user_id=${userId}`);
};

// Get single campaign details
export const getCampaignById = (campaignId, userId) => {
  return api.get(`/api/campaigns/${campaignId}?user_id=${userId}`);
};

// Update campaign
export const updateCampaign = (campaignId, data) => {
  return api.put(`/api/campaigns/${campaignId}`, data);
};

// Cancel campaign
export const cancelCampaign = (campaignId, userId) => {
  return api.post(`/api/campaigns/${campaignId}/cancel`, { user_id: userId });
};

// Delete campaign
export const deleteCampaign = (campaignId, userId) => {
  return api.delete(`/api/campaigns/${campaignId}?user_id=${userId}`);
};

/* =====================================
   HELPER ENDPOINTS
====================================== */

// Get user's groups (for dropdown)
export const getUserGroups = (userId) => {
  return api.get(`/api/campaigns/helpers/groups?user_id=${userId}`);
};

// Get user's templates (for dropdown)
export const getUserTemplates = (userId) => {
  return api.get(`/api/campaigns/helpers/templates?user_id=${userId}`);
};