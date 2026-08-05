import type { ReactNode } from "react";
import { hasAnyRole } from "@/lib/http-client";
import type { UserRole } from "@/types";

interface HasRoleProps {
  roles?: UserRole[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function HasRole({ roles, fallback = null, children }: HasRoleProps) {
  if (!roles || roles.length === 0) {
    return <>{children}</>;
  }

  const isAuthorized = hasAnyRole(roles);

  if (!isAuthorized) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
