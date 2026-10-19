import { ROLE_PERMISSIONS } from "@/constants";
import type { Permission, Role, User } from "@/types";

export type { Permission, Role, User };

/**
 * Pure check: does this role include the permission? Does not read the session.
 */
export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
