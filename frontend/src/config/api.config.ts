const rawApiUrl =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "https://aura-crisis-network-1.onrender.com/api/v1"
    : "http://localhost:5232/api/v1");

const normalizedBaseUrl = rawApiUrl.endsWith("/api/v1")
  ? rawApiUrl
  : `${rawApiUrl.replace(/\/+$/, "")}/api/v1`;

const baseServerUrl = normalizedBaseUrl.replace(/\/api\/v1\/?$/, "");

export const API_CONFIG = {
  BASE_URL: normalizedBaseUrl,
  HUB_URL: import.meta.env.VITE_HUB_URL || `${baseServerUrl}/hubs/crisis`,
  AUTH_STORAGE_KEY: "aura_auth_session",
  TIMEOUT_MS: 30000,
} as const;
