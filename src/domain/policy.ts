import { ACTION, ROLE } from "@/constants";
import type { Action, Role, User } from "@/types";

export type { Action, Role, User };

const STAFF_ACTIONS: Set<Action> = new Set([ACTION.VIEW, ACTION.RECEIVE, ACTION.SELL]);
const MANAGER_ACTIONS: Set<Action> = new Set([
  ACTION.VIEW,
  ACTION.RECEIVE,
  ACTION.SELL,
  ACTION.WRITE_OFF,
  ACTION.TRANSFER,
  ACTION.IMPORT,
]);

/**
 * Check if a role is allowed to perform an action.
 * Staff can view, receive, sell. Manager can do everything.
 */
export function can(role: Role, action: Action): boolean {
  if (role === ROLE.STAFF) {
    return STAFF_ACTIONS.has(action);
  }

  return MANAGER_ACTIONS.has(action);
}
