// src/api/templates.js
import api from "./apiClient";

export const fetchMetaTemplates = (userId) =>
  api.get(`/api/watemplates/meta/list?user_id=${userId}`);

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

export const sendTemplateBulk = (templateId, data) =>
  api.post(`/api/watemplates/send-bulk/${templateId}`, data);

export const fetchTemplateBulkProgress = (userId, templateId) =>
  api.get(
    `/api/watemplates/bulk-progress?user_id=${userId}&templateId=${templateId}`,
  );
