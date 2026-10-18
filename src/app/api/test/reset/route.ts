import "server-only";

import { env } from "@/config/env";
import { HTTP_STATUS } from "@/constants";
import { withApi } from "@/server/http/withApi";

export async function POST(request: Request): Promise<Response> {
  return withApi(
    async ({ repo }) => {
      const isAllowed = env.NODE_ENV === "development" || env.E2E === "1";
      if (!isAllowed) {
        return new Response(null, { status: HTTP_STATUS.NOT_FOUND });
      }

      repo.reset();
      return { success: true };
    },
    { request },
  );
}
