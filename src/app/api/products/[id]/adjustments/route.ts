import "server-only";

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
      const idempotencyKey =
        request.headers.get("idempotency-key") ?? request.headers.get("Idempotency-Key");

      if (!idempotencyKey || idempotencyKey.trim() === "") {
        throw new AppError("IDEMPOTENCY_KEY_REQUIRED", 400, "Missing Idempotency-Key header");
      }

      let rawBody: unknown;
      try {
        rawBody = await request.json();
      } catch {
        throw new AppError("INVALID_JSON", 400, "Invalid JSON body");
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
        headers["Idempotent-Replay"] = "true";
      }

      return new Response(
        JSON.stringify({
          movements: result.movements,
          stock: result.stock,
        }),
        {
          status: 201,
          headers,
        },
      );
    },
    { request },
  );
}
