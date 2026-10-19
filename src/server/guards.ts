import "server-only";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/session";
import { roleHasPermission } from "@/domain";
import type { Permission, User } from "@/types";

export async function requirePermissionOrRedirect(
  permission: Permission,
  redirectTo: string,
): Promise<User> {
  const user = await getCurrentUser();
  if (!roleHasPermission(user.role, permission)) {
    redirect(redirectTo);
  }
  return user;
}
