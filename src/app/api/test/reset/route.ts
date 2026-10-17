import "server-only";

import { withApi } from "@/lib/server/http/with-api";
import { createRepository } from "@/lib/server/repo";

const isDev = process.env.NODE_ENV === "development";
const isE2E = process.env.E2E === "1";

if (!isDev && !isE2E) {
  throw new Error("This route is only available in development or when E2E=1");
}

export async function POST(): Promise<Response> {
  return withApi(async ({ user, repo }) => {
    repo.reset();
    return { success: true };
  });
}
