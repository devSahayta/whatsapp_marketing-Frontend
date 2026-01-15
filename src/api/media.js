// src/api/media.js
import api from "./apiClient";

/**
 * STEP 1 — Create Upload Session ID
 * Body: { user_id, file_name, file_type }
 * Returns: { id: session_id }
 */
export const createUploadSession = (payload) =>
  api.post("/api/watemplates/create-upload-session", payload);

/**
 * STEP 2 — Upload Binary File
 * Send form-data with: user_id (text), session_id (text), file (file)
 * Returns: { h: header_handle }
 */
export const uploadBinary = (formData) =>
  api.post("/api/watemplates/upload-binary", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const uploadMedia = (formData) =>
  api.post("/api/watemplates/upload-media", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const listMedia = (userId) =>
  api.get(`/api/watemplates/media/list?user_id=${userId}`);

export const deleteMedia = (wmu_id) =>
  api.delete(`/api/watemplates/media/${wmu_id}`);
