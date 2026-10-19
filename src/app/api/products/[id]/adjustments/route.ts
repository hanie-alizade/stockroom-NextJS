import "server-only";

import { HTTP_STATUS, IDEMPOTENCY_KEY_HEADER, REPLAY_HEADER } from "@/constants";
import { adjustmentSchema } from "@/schemas";
import { jsonResponse, parseJsonBody, withApi } from "@/server/http";
import type { RouteContext } from "@/server/http";
import { createAdjustment } from "@/server/services/inventory";

export async function POST(request: Request, { params }: RouteContext): Promise<Response> {
  return withApi(request, async ({ user, repo }) => {
    const idempotencyKey = request.headers.get(IDEMPOTENCY_KEY_HEADER) ?? "";
    const parsed = await parseJsonBody(request, adjustmentSchema);
    const { id } = await params;

    const result = await createAdjustment(repo, id, parsed, {
      user,
      idempotencyKey,
    });

    const headers: Record<string, string> = {};
    if (result.replay) {
      headers[REPLAY_HEADER] = "true";
    }

    return jsonResponse(
      {
        movements: result.movements,
        stock: result.stock,
      },
      {
        status: HTTP_STATUS.CREATED,
        headers,
      },
    );
  });
}
