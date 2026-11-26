// src/api/templates.js
import api from "./apiClient";

export const fetchMetaTemplates = (userId) =>
  api.get(`/api/watemplates/meta/list?user_id=${userId}`);

export const fetchTemplatesForBuilder = (userId) =>
  api.get(`/api/watemplates/all?user_id=${userId}`);

export const fetchTemplatesComplete = (userId) =>
  api.get(`/api/watemplates/all?user_id=${userId}`);

export const fetchTemplatesPaginated = (
  userId,
  { page = 1, limit = 10, search = "", status = "ALL", type = "ALL" } = {},
) => {
  const params = new URLSearchParams({ user_id: userId, page, limit });
  if (search) params.set("search", search);
  if (status && status !== "ALL") params.set("status", status);
  if (type && type !== "ALL") params.set("type", type);
  return api.get(`/api/watemplates/list?${params.toString()}`);
};

export const fetchMetaTemplatesById = (templateId, userId) =>
  api.get(
    `/api/watemplates/meta/template?templateId=${templateId}&user_id=${userId}`,
  );

export const fetchMetaTemplatesByName = (templateName, userId) =>
  api.get(
    `/api/watemplates/meta/template?templateName=${templateName}&user_id=${userId}`,
  );

export const deleteMetaTemplate = (templateId, templateName, userId) =>
  api.delete(
    `/api/watemplates/meta/${templateId}?user_id=${userId}&template_name=${templateName}`,
  );

export const createTemplate = (payload) =>
  api.post("/api/watemplates/create", payload);

export const sendTemplate = (templateId, data) =>
  api.post(`/api/watemplates/send/${templateId}`, data);

// Send one approved template (normal or carousel) into an existing chat.
// payload: { chat_id, wt_id, body_variables, header_variable, button_variables }
export const sendTemplateToChat = (payload, token) =>
  api.post("/admin/chat/send-template", payload, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

export const sendTemplateBulk = (templateId, data) =>
  api.post(`/api/watemplates/send-bulk/${templateId}`, data);

export const fetchTemplateBulkProgress = (userId, templateId) =>
  api.get(
    `/api/watemplates/bulk-progress?user_id=${userId}&templateId=${templateId}`,
  );

export const fetchDbTemplates = (userId) =>
  api.get(`/api/watemplates?user_id=${userId}`);

export const uploadTemplateMedia = (wtId, body) =>
  api.patch(`/api/watemplates/${wtId}/media-id`, body);

export const uploadCarouselCardMedia = (wtId, body) =>
  api.patch(`/api/watemplates/${wtId}/carousel-media`, body);
