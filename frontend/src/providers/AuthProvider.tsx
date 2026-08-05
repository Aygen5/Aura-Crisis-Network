import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { getStoredAuth, isAuthenticated, clearStoredAuth } from "@/lib/http-client";
import { authService } from "@/services";
import type { AuthResponseDto, LoginUserRequest } from "@/types";

interface AuthContextType {
  user: AuthResponseDto | null;
  authenticated: boolean;
  login: (request: LoginUserRequest) => Promise<AuthResponseDto>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthResponseDto | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    setUser(getStoredAuth());
    setAuthenticated(isAuthenticated());
  }, []);

  async function login(request: LoginUserRequest): Promise<AuthResponseDto> {
    const res = await authService.login(request);
    setUser(res);
    setAuthenticated(true);
    return res;
  }

  function logout() {
    authService.logout();
    setUser(null);
    setAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{ user, authenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
