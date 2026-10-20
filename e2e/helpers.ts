import type { APIRequestContext, BrowserContext } from "@playwright/test";

/**
 * Resets the in-memory repository to seed data.
 */
export async function resetData(request: APIRequestContext): Promise<void> {
  const response = await request.post("/api/test/reset");
  if (!response.ok()) {
    throw new Error(`Failed to reset data: ${response.status()}`);
  }
}

/**
 * Sets the stockroom_user session cookie on the browser context.
 */
export async function switchUser(context: BrowserContext, userId: string): Promise<void> {
  await context.addCookies([
    {
      name: "stockroom_user",
      value: userId,
      domain: "localhost",
      path: "/",
    },
  ]);
}
