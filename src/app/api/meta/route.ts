import "server-only";

import { withApi } from "@/server/http/withApi";
import { getMeta } from "@/server/services/meta";

export async function GET(request: Request): Promise<Response> {
  return withApi(async ({ user, repo }) => getMeta(repo, user), { request });
}
