// src/api/apiClient.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

// Kinde access tokens expire, so a token set once at login goes stale in a
// long session. App.jsx registers Kinde's getToken here; it returns a cached
// token and refreshes it when needed, so every request carries a valid one.
let tokenGetter = null;

export const setAuthTokenGetter = (getter) => {
  tokenGetter = typeof getter === "function" ? getter : null;
};

api.interceptors.request.use(async (config) => {
  // axios has already merged the default (possibly stale) header into
  // config.headers here, so always replace it with the current token.
  if (!tokenGetter) return config;
  try {
    const token = await tokenGetter();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  } catch {
    // Fall back to the default header set by setAuthToken
  }
  return config;
});

export default api;
