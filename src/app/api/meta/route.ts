import "server-only";

import { withApi } from "@/lib/server/http/with-api";
import { createRepository } from "@/lib/server/repo";

export async function GET(): Promise<Response> {
  return withApi(async ({ user, repo }) => {
    const stores = repo.getStores();
    const categories = repo.getCategories();
    const users = repo.getUsers();

    return {
      stores,
      categories,
      users,
      currentUser: user,
    };
  });
}
