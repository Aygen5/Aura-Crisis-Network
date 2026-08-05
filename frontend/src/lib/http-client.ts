import { API_CONFIG } from "@/config";
import type { AuthResponseDto } from "@/types";

let isRefreshing = false;
let refreshPromise: Promise<AuthResponseDto | null> | null = null;

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

export function getUserRoles(): string[] {
  const auth = getStoredAuth();
  return auth?.roles || [];
}

export function hasAnyRole(requiredRoles?: string[]): boolean {
  if (!requiredRoles || requiredRoles.length === 0) return true;
  const userRoles = getUserRoles();
  return requiredRoles.some((role) => userRoles.includes(role));
}

async function performSilentRefresh(): Promise<AuthResponseDto | null> {
  const auth = getStoredAuth();
  if (!auth?.refreshToken) return null;

  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
      }),
    });

    if (!response.ok) {
      clearStoredAuth();
      return null;
    }

    const data: AuthResponseDto = await response.json();
    setStoredAuth(data);
    return data;
  } catch {
    clearStoredAuth();
    return null;
  }
}

export async function httpClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const auth = getStoredAuth();
  const headers: Record<string, string> = {
    ...((options?.headers as Record<string, string>) || {}),
  };

  if (!(options?.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (auth?.accessToken) {
    headers["Authorization"] = `Bearer ${auth.accessToken}`;
  }

  let response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const isAuthEndpoint = endpoint.startsWith("/auth/");

  if (response.status === 401 && !isAuthEndpoint) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = performSilentRefresh().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }

    const refreshedAuth = await refreshPromise;

    if (refreshedAuth?.accessToken) {
      headers["Authorization"] = `Bearer ${refreshedAuth.accessToken}`;
      response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
    } else {
      clearStoredAuth();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
      throw new Error("Oturum süreniz doldu. Lütfen tekrar giriş yapınız.");
    }
  }

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
