import { PERMISSION, ROLE } from "@/constants";
import type { Permission, Role, User } from "@/types";

export type { Permission, Role, User };

const STAFF_PERMISSIONS: Set<Permission> = new Set([
  PERMISSION.VIEW,
  PERMISSION.RECEIVE,
  PERMISSION.SELL,
]);
const MANAGER_PERMISSIONS: Set<Permission> = new Set([
  PERMISSION.VIEW,
  PERMISSION.RECEIVE,
  PERMISSION.SELL,
  PERMISSION.WRITE_OFF,
  PERMISSION.TRANSFER,
  PERMISSION.IMPORT,
]);

/**
 * Pure check: does this role include the permission? Does not read the session.
 */
export function roleHasPermission(role: Role, permission: Permission): boolean {
  if (role === ROLE.STAFF) {
    return STAFF_PERMISSIONS.has(permission);
  }

  return MANAGER_PERMISSIONS.has(permission);
}
