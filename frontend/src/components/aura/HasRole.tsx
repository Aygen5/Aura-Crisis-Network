import type { ReactNode } from "react";
import { useAuth } from "@/providers/AuthProvider";
import type { UserRole } from "@/types";

interface HasRoleProps {
  roles?: UserRole[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function HasRole({ roles, fallback = null, children }: HasRoleProps) {
  const { user, isHydrated } = useAuth();

  if (!roles || roles.length === 0) {
    return <>{children}</>;
  }

  if (!isHydrated || !user || !user.roles) {
    return <>{fallback}</>;
  }

  const userRoles = user.roles;
  const isAuthorized = roles.some((role) => userRoles.includes(role));

  if (!isAuthorized) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
