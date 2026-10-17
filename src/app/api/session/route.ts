import "server-only";

import { cookies } from "next/headers";
import { z } from "zod";
import { withApi } from "@/lib/server/http/with-api";
import { AppError } from "@/lib/domain/errors";

const sessionSchema = z.object({
  userId: z.string(),
});

export async function POST(request: Request): Promise<Response> {
  return withApi(
    async ({ user, repo }) => {
      const body = await request.json();
      const { userId } = sessionSchema.parse(body);

      const targetUser = repo.getUsers().find((u) => u.id === userId);
      if (!targetUser) {
        throw new AppError("VALIDATION_ERROR", 422, "Validation failed", [
          { field: "userId", code: "UNKNOWN_USER", message: "Unknown user." },
        ]);
      }

      const cookieStore = await cookies();
      cookieStore.set("stockroom_user", userId, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
      });

      return { user: targetUser };
    },
    { request },
  );
}
