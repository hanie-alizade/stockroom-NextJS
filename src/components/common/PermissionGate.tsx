import type { ReactNode } from "react";
import { useHasPermission } from "@/providers";
import type { Permission } from "@/types";

export interface PermissionGateProps {
  permission: Permission;
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGate({
  permission,
  fallback = null,
  children,
}: PermissionGateProps): React.ReactElement | null {
  const hasPermission = useHasPermission(permission);

  if (!hasPermission) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}
