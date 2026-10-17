import "server-only";

import { cookies } from "next/headers";
import { ZodError } from "zod";

import { AppError, type ErrorCode, type FieldError } from "@/lib/domain/errors";
import type { Role, User, Action } from "@/lib/domain/policy";
import { can } from "@/lib/domain/policy";
import { createRepository } from "@/lib/server/repo";

export type WithApiOptions = {
  action?: Action;
  request?: Request;
};

const SIMULATED_LATENCY_MS = Number(process.env.SIMULATED_LATENCY_MS ?? "500");

export async function withApi<T>(
  handler: (context: { user: User; repo: ReturnType<typeof createRepository> }) => Promise<T>,
  options: WithApiOptions = {},
): Promise<Response> {
  // Simulated latency
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));

  // Fail switch
  const requestUrl = options.request ? options.request.url : globalThis.url;
  const url = new URL(requestUrl ?? "", "http://localhost");
  if (url.searchParams.has("fail")) {
    return errorResponse("INTERNAL_ERROR", 500, "Forced failure");
  }

  // Get user from cookie
  const repo = createRepository();
  const users = repo.getUsers();
  const cookieStore = await cookies();
  const userId = cookieStore.get("stockroom_user")?.value;
  const user =
    users.find((u) => u.id === userId) ?? users.find((u) => u.role === "staff") ?? users[0];

  // Authorization
  if (options.action && !can(user.role, options.action)) {
    return errorResponse("FORBIDDEN", 403, "You do not have permission to perform this action");
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
        code: "VALIDATION_ERROR",
        message: issue.message,
      }));
      return errorResponse("VALIDATION_ERROR", 422, "Validation failed", fieldErrors);
    }
    return errorResponse("INTERNAL_ERROR", 500, "An unexpected error occurred");
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
