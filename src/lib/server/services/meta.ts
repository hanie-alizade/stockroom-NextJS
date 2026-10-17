import "server-only";

import type { Repository } from "@/lib/server/repo";
import type { User } from "@/lib/domain/policy";

export async function getMeta(repo: Repository, user: User) {
  const stores = repo.getStores();
  const categories = repo.getCategories();
  const users = repo.getUsers();

  return {
    stores,
    categories,
    users,
    currentUser: user,
  };
}
