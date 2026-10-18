import "server-only";

import {
  ERROR_CODE,
  HTTP_STATUS,
  IDEMPOTENCY_KEY_HEADER,
  REPLAY_HEADER,
} from "@/constants";
import { AppError } from "@/lib/domain/errors";
import { adjustmentSchema } from "@/lib/domain/schemas";
import { withApi } from "@/lib/server/http/with-api";
import { createAdjustment } from "@/lib/server/services/inventory.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } },
): Promise<Response> {
  globalThis.url = request.url;

  return withApi(
    async ({ user, repo }) => {
      const idempotencyKey = request.headers.get(IDEMPOTENCY_KEY_HEADER);

      if (!idempotencyKey || idempotencyKey.trim() === "") {
        throw new AppError(
          ERROR_CODE.IDEMPOTENCY_KEY_REQUIRED,
          HTTP_STATUS.BAD_REQUEST,
          "Missing Idempotency-Key header",
        );
      }

      let rawBody: unknown;
      try {
        rawBody = await request.json();
      } catch {
        throw new AppError(
          ERROR_CODE.INVALID_JSON,
          HTTP_STATUS.BAD_REQUEST,
          "Invalid JSON body",
        );
      }

      const parsed = adjustmentSchema.parse(rawBody);
      const { id } = await params;

      const result = await createAdjustment(repo, id, parsed, {
        role: user.role,
        idempotencyKey,
        userId: user.id,
      });

      const headers: Record<string, string> = {
        "content-type": "application/json",
      };
      if (result.replay) {
        headers[REPLAY_HEADER] = "true";
      }

      return new Response(
        JSON.stringify({
          movements: result.movements,
          stock: result.stock,
        }),
        {
          status: HTTP_STATUS.CREATED,
          headers,
        },
      );
    },
    { request },
  );
}
