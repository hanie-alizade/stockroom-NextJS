import "server-only";

import { z } from "zod";
import {
  ADJUSTMENT_PERMISSION,
  ADJUSTMENT_TYPE,
  ERROR_CODE,
  HTTP_STATUS,
  IDEMPOTENCY_KEY_HEADER,
  REPLAY_HEADER,
} from "@/constants";
import { AppError, roleHasPermission } from "@/domain";
import { adjustmentSchema } from "@/schemas";
import { jsonResponse, readJsonBody, withApi } from "@/server/http";
import type { RouteContext } from "@/server/http";
import { createAdjustment } from "@/server/services/inventory";

const adjustmentTypeSchema = z.object({
  type: z.nativeEnum(ADJUSTMENT_TYPE),
});

export async function POST(
  request: Request,
  { params }: RouteContext,
): Promise<Response> {
  return withApi(request, async ({ user, repo }) => {
    const idempotencyKey = request.headers.get(IDEMPOTENCY_KEY_HEADER) ?? "";
    if (!idempotencyKey.trim()) {
      throw new AppError(
        ERROR_CODE.IDEMPOTENCY_KEY_REQUIRED,
        HTTP_STATUS.BAD_REQUEST,
        "Missing Idempotency-Key header",
      );
    }

    const rawBody = await readJsonBody(request);
    const { type } = adjustmentTypeSchema.parse(rawBody);

    const permission = ADJUSTMENT_PERMISSION[type];
    if (!roleHasPermission(user.role, permission)) {
      throw new AppError(
        ERROR_CODE.FORBIDDEN,
        HTTP_STATUS.FORBIDDEN,
        "You do not have permission to perform this action",
      );
    }

    const parsed = adjustmentSchema.parse(rawBody);
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
