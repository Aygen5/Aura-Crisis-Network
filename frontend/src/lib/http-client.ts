import { API_CONFIG } from "@/config";
import type { AuthResponseDto } from "@/types";

export function getStoredAuth(): AuthResponseDto | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(API_CONFIG.AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredAuth(authData: AuthResponseDto): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(API_CONFIG.AUTH_STORAGE_KEY, JSON.stringify(authData));
  }
}

export function clearStoredAuth(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(API_CONFIG.AUTH_STORAGE_KEY);
  }
}

export function isAuthenticated(): boolean {
  const auth = getStoredAuth();
  return auth !== null && !!auth.accessToken;
}

export async function httpClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const auth = getStoredAuth();
  const headers: Record<string, string> = {
    ...((options?.headers as Record<string, string>) || {})
  };

  if (!(options?.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (auth?.accessToken) {
    headers["Authorization"] = `Bearer ${auth.accessToken}`;
  }

  const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    const msg = errData?.errors?.[0] || errData?.Message || `API Error: ${response.status} ${response.statusText}`;
    throw new Error(msg);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
