export type Role = "manager" | "staff";

export type User = {
  id: string;
  name: string;
  initials: string;
  role: Role;
};

export type Action = "view" | "receive" | "sell" | "write_off" | "transfer" | "import";

const STAFF_ACTIONS: Set<Action> = new Set(["view", "receive", "sell"]);
const MANAGER_ACTIONS: Set<Action> = new Set([
  "view",
  "receive",
  "sell",
  "write_off",
  "transfer",
  "import",
]);

/**
 * Check if a role is allowed to perform an action.
 * Staff can view, receive, sell. Manager can do everything.
 */
export function can(role: Role, action: Action): boolean {
  if (role === "staff") {
    return STAFF_ACTIONS.has(action);
  }

  return MANAGER_ACTIONS.has(action);
}
