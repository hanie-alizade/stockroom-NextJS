import "server-only";

import type { z } from "zod";
import { ERROR_CODE, HTTP_STATUS } from "@/constants";
import { AppError } from "@/domain";

export type RouteContext = { params: Promise<{ id: string }> };

/**
 * Parses URL query parameters using the provided Zod schema.
 */
export function parseQuery<T extends z.ZodTypeAny>(request: Request, schema: T): z.infer<T> {
  const url = new URL(request.url);
  const rawParams = Object.fromEntries(url.searchParams.entries());
  return schema.parse(rawParams);
}

/**
 * Reads and parses JSON body from request using the provided Zod schema, throwing INVALID_JSON on parse error.
 */
export async function parseJsonBody<T extends z.ZodTypeAny>(
  request: Request,
  schema: T,
): Promise<z.infer<T>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new AppError(
      ERROR_CODE.INVALID_JSON,
      HTTP_STATUS.BAD_REQUEST,
      "Invalid JSON body",
    );
  }
  return schema.parse(raw);
}

/**
 * Creates a standard JSON Response.
 */
export function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return Response.json(body, init);
}
