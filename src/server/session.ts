import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { createRepository } from "@/server/repositories";
import { ROLE, SESSION_COOKIE } from "@/constants";
import type { User } from "@/types";

export const getCurrentUser = cache(async (): Promise<User> => {
  const repo = createRepository();
  const users = repo.getUsers();
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE)?.value;
  // Unknown or missing cookie falls back to Staff (least privilege)
  const user =
    users.find((u) => u.id === userId) ?? users.find((u) => u.role === ROLE.STAFF) ?? users[0];
  return user;
});
