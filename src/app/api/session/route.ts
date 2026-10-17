import "server-only";

import { cookies } from "next/headers";
import { z } from "zod";
import { withApi } from "@/lib/server/http/with-api";
import { createRepository } from "@/lib/server/repo";

const sessionSchema = z.object({
  userId: z.string(),
});

export async function POST(request: Request): Promise<Response> {
  return withApi(async ({ user, repo }) => {
    const body = await request.json();
    const { userId } = sessionSchema.parse(body);

    const targetUser = repo.getUsers().find((u) => u.id === userId);

    const cookieStore = await cookies();
    cookieStore.set("stockroom_user", userId);

    return { user: targetUser };
  });
}
