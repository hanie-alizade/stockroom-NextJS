import "server-only";

import type { Repository } from "@/server/repositories";
import type { User } from "@/types";

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
