import "server-only";

import { ZodError } from "zod";

import { AppError, can } from "@/domain";
import type { Action, ErrorCode, FieldError, User } from "@/types";
import { createRepository } from "@/server/repositories";
import { getCurrentUser } from "@/server/session";

import { env } from "@/config/env";
import { ERROR_CODE, FIELD_ERROR_CODE, HTTP_STATUS } from "@/constants";

export type WithApiOptions = {
  action?: Action;
};

/**
 * Wraps Route Handler logic with latency simulation, error handling, session resolution, and authorization checks.
 */
export async function withApi<T>(
  request: Request,
  handler: (context: { user: User; repo: ReturnType<typeof createRepository> }) => Promise<T>,
  options?: WithApiOptions,
): Promise<Response> {
  // Simulated latency
  await new Promise((resolve) => setTimeout(resolve, env.SIMULATED_LATENCY_MS));

  // Fail switch
  const url = new URL(request.url);
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
  if (options?.action && !can(user.role, options.action)) {
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
        code: mapZodIssueToFieldCode(issue),
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

function mapZodIssueToFieldCode(issue: ZodError["issues"][number]): string {
  if (issue.code === "invalid_type" && issue.received === "undefined") {
    return FIELD_ERROR_CODE.REQUIRED;
  }
  if (issue.code === "invalid_type" && issue.expected === "integer") {
    return FIELD_ERROR_CODE.NOT_A_WHOLE_NUMBER;
  }
  if (issue.code === "too_small" && issue.type === "number") {
    return FIELD_ERROR_CODE.MUST_BE_POSITIVE;
  }
  if (issue.code === "too_small" && issue.type === "string") {
    return FIELD_ERROR_CODE.TOO_SHORT;
  }
  if (issue.code === "too_big" && issue.type === "string") {
    return FIELD_ERROR_CODE.TOO_LONG;
  }
  return FIELD_ERROR_CODE.VALIDATION_ERROR;
}
