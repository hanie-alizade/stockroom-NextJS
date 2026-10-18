import "server-only";

import type { Repository } from "@/server/repositories";
import type { MetaResponse, User } from "@/types";

/**
 * Retrieves global application metadata including stores, categories, users, and the current session user.
 */
export async function getMeta(repo: Repository, user: User): Promise<MetaResponse> {
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
