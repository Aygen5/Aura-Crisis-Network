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

export function isJwtTokenExpired(token: string): boolean {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const payloadJson = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson);
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000 - 5000;
  } catch {
    return true;
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  const auth = getStoredAuth();
  if (!auth || !auth.accessToken) return false;

  if (isJwtTokenExpired(auth.accessToken)) {
    if (!auth.refreshToken || (auth.refreshTokenExpiresAt && Date.now() >= new Date(auth.refreshTokenExpiresAt).getTime())) {
      clearStoredAuth();
      return false;
    }
  }

  if (auth.refreshTokenExpiresAt) {
    try {
      const expiresAt = new Date(auth.refreshTokenExpiresAt).getTime();
      if (isNaN(expiresAt) || Date.now() >= expiresAt) {
        clearStoredAuth();
        return false;
      }
    } catch {
      clearStoredAuth();
      return false;
    }
  }
  return true;
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

  let response: Response;

  try {
    response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (networkErr) {
    throw new Error("Sunucuya bağlanılamıyor. Lütfen sunucunun çalıştığından ve internet bağlantınızdan emin olunuz.");
  }

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
      try {
        response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });
      } catch {
        throw new Error("Sunucuya bağlanılamıyor. Lütfen tekrar deneyiniz.");
      }
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

    if (response.status === 401) {
      const serverMsg = errData?.Message || errData?.errors?.[0];
      throw new Error(serverMsg || "E-posta veya şifre hatalı.");
    }

    if (response.status === 403) {
      throw new Error("Bu işlem için yetkiniz bulunmamaktadır.");
    }

    if (response.status === 404) {
      throw new Error("Sunucu kaynağı veya istenen uç nokta bulunamadı.");
    }

    if (response.status === 422 || response.status === 400) {
      if (errData?.errors) {
        if (Array.isArray(errData.errors)) {
          throw new Error(errData.errors.join(" "));
        }
        if (typeof errData.errors === "object") {
          const messages = Object.values(errData.errors).flat().join(" ");
          if (messages) throw new Error(messages);
        }
      }
      const msg = errData?.Message || errData?.title || errData?.detail || "Girilen veriler doğrulanamadı. Lütfen alanları kontrol ediniz.";
      throw new Error(msg);
    }

    if (response.status >= 500) {
      throw new Error("Sunucuda beklenmeyen bir kriz hatası oluştu. Lütfen sistem yöneticisi ile iletişime geçiniz.");
    }

    const defaultMsg = errData?.errors?.[0] || errData?.Message || `İşlem başarısız: HTTP ${response.status}`;
    throw new Error(defaultMsg);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
