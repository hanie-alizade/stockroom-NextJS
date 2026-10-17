import "server-only";

import { withApi } from "@/lib/server/http/with-api";
import { getMeta } from "@/lib/server/services/meta";

export async function GET(request: Request): Promise<Response> {
  return withApi(async ({ user, repo }) => getMeta(repo, user), { request });
}
