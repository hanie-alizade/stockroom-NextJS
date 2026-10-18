export const ROLE = {
  MANAGER: "manager",
  STAFF: "staff",
} as const;

export const ROLE_LABEL = {
  [ROLE.MANAGER]: "Manager",
  [ROLE.STAFF]: "Staff",
} as const;
