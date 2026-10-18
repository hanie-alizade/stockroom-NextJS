import "server-only";

import { ZodError } from "zod";

import { AppError, type ErrorCode, type FieldError } from "@/lib/domain/errors";
import type { Role, User, Action } from "@/lib/domain/policy";
import { can } from "@/lib/domain/policy";
import { createRepository } from "@/lib/server/repo";
import { getCurrentUser } from "@/lib/server/session";

import { env } from "@/config/env";
import { ERROR_CODE, FIELD_ERROR_CODE, HTTP_STATUS } from "@/constants";

export type WithApiOptions = {
  action?: Action;
  request?: Request;
};

export async function withApi<T>(
  handler: (context: { user: User; repo: ReturnType<typeof createRepository> }) => Promise<T>,
  options: WithApiOptions = {},
): Promise<Response> {
  // Simulated latency
  await new Promise((resolve) => setTimeout(resolve, env.SIMULATED_LATENCY_MS));

  // Fail switch
  const requestUrl = options.request ? options.request.url : globalThis.url;
  const url = new URL(requestUrl ?? "", "http://localhost");
  if (url.searchParams.has("fail")) {
    return errorResponse(ERROR_CODE.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR, "Forced failure");
  }

  // Get user from cookie
  const user = await getCurrentUser();
  const repo = createRepository();

  // Authorization
  if (options.action && !can(user.role, options.action)) {
    return errorResponse(ERROR_CODE.FORBIDDEN, HTTP_STATUS.FORBIDDEN, "You do not have permission to perform this action");
  }

  try {
    const result = await handler({ user, repo });
    if (result instanceof Response) {
      return result;
    }
    return Response.json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.code, error.status, error.message, error.fieldErrors);
    }
    if (error instanceof SyntaxError) {
      return errorResponse(ERROR_CODE.INVALID_JSON, HTTP_STATUS.BAD_REQUEST, "Invalid JSON body");
    }
    if (error instanceof ZodError) {
      const fieldErrors: FieldError[] = error.issues.map((issue) => ({
        field: issue.path.join("."),
        code: FIELD_ERROR_CODE.VALIDATION_ERROR,
        message: issue.message,
      }));
      return errorResponse(ERROR_CODE.VALIDATION_ERROR, HTTP_STATUS.UNPROCESSABLE_ENTITY, "Validation failed", fieldErrors);
    }
    return errorResponse(ERROR_CODE.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR, "An unexpected error occurred");
  }
}

function errorResponse(
  code: ErrorCode,
  status: number,
  message: string,
  fieldErrors: FieldError[] = [],
): Response {
  return Response.json({ error: code, message, fieldErrors }, { status });
}
