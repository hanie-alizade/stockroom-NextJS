import { PERMISSION } from "./permissions";

export const ROLE = {
  MANAGER: "manager",
  STAFF: "staff",
} as const;

export type Role = (typeof ROLE)[keyof typeof ROLE];
type Permission = (typeof PERMISSION)[keyof typeof PERMISSION];

export const ROLE_LABEL = {
  [ROLE.MANAGER]: "Manager",
  [ROLE.STAFF]: "Staff",
} as const;

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  [ROLE.STAFF]: [PERMISSION.VIEW, PERMISSION.RECEIVE, PERMISSION.SELL],
  [ROLE.MANAGER]: [
    PERMISSION.VIEW,
    PERMISSION.RECEIVE,
    PERMISSION.SELL,
    PERMISSION.WRITE_OFF,
    PERMISSION.TRANSFER,
    PERMISSION.IMPORT,
  ],
} as const;
