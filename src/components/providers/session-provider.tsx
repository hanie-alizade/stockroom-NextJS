"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Action, User } from "@/types";
import { can } from "@/lib/domain/policy";

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

export function useCan(action: Action): boolean {
  const user = useCurrentUser();
  return can(user.role, action);
}
