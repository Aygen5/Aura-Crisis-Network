import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getStoredAuth, isAuthenticated } from "@/lib/http-client";
import { authService } from "@/services";
import type { AuthResponseDto, LoginUserRequest } from "@/types";

interface AuthContextType {
  user: AuthResponseDto | null;
  authenticated: boolean;
  isHydrated: boolean;
  login: (request: LoginUserRequest) => Promise<AuthResponseDto>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthResponseDto | null>(() => getStoredAuth());
  const [authenticated, setAuthenticated] = useState<boolean>(() => isAuthenticated());
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  useEffect(() => {
    const syncAuth = () => {
      setUser(getStoredAuth());
      setAuthenticated(isAuthenticated());
    };
    syncAuth();
    setIsHydrated(true);
    if (typeof window !== "undefined") {
      window.addEventListener("storage", syncAuth);
      return () => window.removeEventListener("storage", syncAuth);
    }
  }, []);

  async function login(request: LoginUserRequest): Promise<AuthResponseDto> {
    const res = await authService.login(request);
    setUser(res);
    setAuthenticated(true);
    return res;
  }

  function logout() {
    authService.logout();
    queryClient.clear();
    setUser(null);
    setAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{ user, authenticated, isHydrated, login, logout }}>
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
