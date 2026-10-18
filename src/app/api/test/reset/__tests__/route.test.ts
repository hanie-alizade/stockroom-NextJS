import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { POST } from "../route";
import { cookies } from "next/headers";
import { mockCookies as createMockCookies } from "tests/helpers";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

const mockCookies = createMockCookies("faiz-hakim");

describe("POST /api/test/reset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue(mockCookies);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 404 in production when E2E is not set", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("E2E", "0");

    const request = new Request("http://localhost/api/test/reset", {
      method: "POST",
    });

    const response = await POST(request);
    expect(response.status).toBe(404);
  });

  it("resets and returns 200 in development", async () => {
    vi.stubEnv("NODE_ENV", "development");

    const request = new Request("http://localhost/api/test/reset", {
      method: "POST",
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ success: true });
  });
});
