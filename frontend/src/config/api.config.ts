export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5232/api/v1",
  HUB_URL: import.meta.env.VITE_HUB_URL || "http://localhost:5232/hubs/crisis",
  AUTH_STORAGE_KEY: "aura_auth_session",
  TIMEOUT_MS: 30000,
} as const;
