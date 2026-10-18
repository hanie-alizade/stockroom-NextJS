import "server-only";

import { ERROR_CODE, HTTP_STATUS } from "@/constants";
import { AppError } from "@/domain";

export async function readJsonBody<T = unknown>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new AppError(
      ERROR_CODE.INVALID_JSON,
      HTTP_STATUS.BAD_REQUEST,
      "Invalid JSON body",
    );
  }
}
