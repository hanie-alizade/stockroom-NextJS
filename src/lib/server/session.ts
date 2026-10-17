import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { createRepository } from "@/lib/server/repo";
import type { User } from "@/lib/domain/policy";

export const getCurrentUser = cache(async (): Promise<User> => {
  const repo = createRepository();
  const users = repo.getUsers();
  const cookieStore = await cookies();
  const userId = cookieStore.get("stockroom_user")?.value;
  const user =
    users.find((u) => u.id === userId) ?? users.find((u) => u.role === "staff") ?? users[0];
  return user;
});
