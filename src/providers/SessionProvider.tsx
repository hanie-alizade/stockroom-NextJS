"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Permission, User } from "@/types";
import { roleHasPermission } from "@/domain";

interface SessionContextValue {
  user: User;
}

const SessionContext = createContext<SessionContextValue | null>(null);

interface SessionProviderProps {
  children: ReactNode;
  user: User;
}

export function SessionProvider({ children, user }: SessionProviderProps): ReactNode {
  return <SessionContext.Provider value={{ user }}>{children}</SessionContext.Provider>;
}

export function useCurrentUser(): User {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useCurrentUser must be used within SessionProvider");
  }
  return context.user;
}

/**
 * Does the signed-in user have the permission? Reads the user from the session context.
 */
export function useHasPermission(permission: Permission): boolean {
  const user = useCurrentUser();
  return roleHasPermission(user.role, permission);
}
