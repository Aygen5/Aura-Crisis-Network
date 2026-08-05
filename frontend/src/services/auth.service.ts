import { httpClient, setStoredAuth, clearStoredAuth, getStoredAuth } from "@/lib/http-client";
import type { AuthResponseDto, LoginUserRequest, RegisterUserRequest, RefreshTokenRequest } from "@/types";

export const authService = {
  async login(request: LoginUserRequest): Promise<AuthResponseDto> {
    const response = await httpClient<AuthResponseDto>("/auth/login", {
      method: "POST",
      body: JSON.stringify(request)
    });
    setStoredAuth(response);
    return response;
  },

  async register(request: RegisterUserRequest): Promise<{ userId: string }> {
    return httpClient<{ userId: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(request)
    });
  },

  async refreshToken(): Promise<AuthResponseDto | null> {
    const auth = getStoredAuth();
    if (!auth) return null;

    try {
      const request: RefreshTokenRequest = {
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken
      };
      const response = await httpClient<AuthResponseDto>("/auth/refresh-token", {
        method: "POST",
        body: JSON.stringify(request)
      });
      setStoredAuth(response);
      return response;
    } catch {
      clearStoredAuth();
      return null;
    }
  },

  logout(): void {
    clearStoredAuth();
  }
};
