import "server-only";

import {
  ERROR_CODE,
  HTTP_STATUS,
  IDEMPOTENCY_KEY_HEADER,
  REPLAY_HEADER,
} from "@/constants";
import { AppError } from "@/domain";
import { adjustmentSchema } from "@/schemas";
import { withApi } from "@/server/http/withApi";
import { readJsonBody } from "@/server/http/readJsonBody";
import { createAdjustment } from "@/server/services/inventory";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } },
): Promise<Response> {
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

      const rawBody = await readJsonBody(request);
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
