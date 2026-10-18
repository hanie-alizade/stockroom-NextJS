import "server-only";

import { cookies } from "next/headers";
import { ERROR_CODE, FIELD_ERROR_CODE, HTTP_STATUS, SESSION_COOKIE } from "@/constants";
import { AppError } from "@/domain";
import { withApi } from "@/server/http/withApi";
import { readJsonBody } from "@/server/http/readJsonBody";
import { sessionBodySchema } from "@/schemas";

export async function POST(request: Request): Promise<Response> {
  return withApi(
    async ({ repo }) => {
      const body = await readJsonBody(request);
      const { userId } = sessionBodySchema.parse(body);

      const targetUser = repo.getUsers().find((u) => u.id === userId);
      if (!targetUser) {
        throw new AppError(
          ERROR_CODE.VALIDATION_ERROR,
          HTTP_STATUS.UNPROCESSABLE_ENTITY,
          "Validation failed",
          [{ field: "userId", code: FIELD_ERROR_CODE.UNKNOWN_USER, message: "Unknown user." }],
        );
      }

      const cookieStore = await cookies();
      cookieStore.set(SESSION_COOKIE, userId, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
      });

      return { user: targetUser };
    },
    { request },
  );
}
