import "server-only";

import { jsonResponse, withApi } from "@/server/http";
import { getMeta } from "@/server/services/meta";

export async function GET(request: Request): Promise<Response> {
  return withApi(request, async ({ user, repo }) => {
    const data = await getMeta(repo, user);
    return jsonResponse(data);
  });
}
