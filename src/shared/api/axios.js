import axios from "axios";
import { readStorage } from "../../utils/storage";

export const TOKEN_KEY = "hesabla-token";

export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000",
  timeout: 15000,
});

let onUnauthorized = null;
// AuthProvider registers a handler that logs the user out on an expired session.
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

api.interceptors.request.use((config) => {
  const token = readStorage(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error?.config?.url || "";
    const isAuthForm = url.startsWith("/auth/login") || url.startsWith("/auth/register");
    if (error?.response?.status === 401 && !isAuthForm) onUnauthorized?.();
    return Promise.reject(error);
  },
);

// Human-readable message for an axios error.
export const errorMessage = (error, fallback = "Xəta baş verdi") => {
  if (error?.response?.data?.error) return error.response.data.error;
  if (error?.request && !error?.response) return "Server əlçatan deyil";
  return fallback;
};

export const isNetworkError = (error) => Boolean(error?.request && !error?.response);
