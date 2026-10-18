import "server-only";

import { ZodError } from "zod";

import { AppError, can } from "@/domain";
import type { Action, ErrorCode, FieldError, User } from "@/types";
import { createRepository } from "@/server/repositories";
import { getCurrentUser } from "@/server/session";

import { env } from "@/config/env";
import { ERROR_CODE, FIELD_ERROR_CODE, HTTP_STATUS } from "@/constants";

export type WithApiOptions = {
  request: Request;
  action?: Action;
};

export async function withApi<T>(
  handler: (context: { user: User; repo: ReturnType<typeof createRepository> }) => Promise<T>,
  options: WithApiOptions,
): Promise<Response> {
  // Simulated latency
  await new Promise((resolve) => setTimeout(resolve, env.SIMULATED_LATENCY_MS));

  // Fail switch
  const url = new URL(options.request.url);
  if (url.searchParams.get("fail") === "1") {
    return errorResponse(
      ERROR_CODE.INTERNAL_ERROR,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "Forced failure",
    );
  }

  // Get user from cookie
  const user = await getCurrentUser();
  const repo = createRepository();

  // Authorization
  if (options.action && !can(user.role, options.action)) {
    return errorResponse(
      ERROR_CODE.FORBIDDEN,
      HTTP_STATUS.FORBIDDEN,
      "You do not have permission to perform this action",
    );
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
    if (error instanceof ZodError) {
      const fieldErrors: FieldError[] = error.issues.map((issue) => ({
        field: issue.path.join("."),
        code: FIELD_ERROR_CODE.VALIDATION_ERROR,
        message: issue.message,
      }));
      return errorResponse(
        ERROR_CODE.VALIDATION_ERROR,
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        "Validation failed",
        fieldErrors,
      );
    }
    console.error(error);
    return errorResponse(
      ERROR_CODE.INTERNAL_ERROR,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "An unexpected error occurred",
    );
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
