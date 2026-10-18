import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "../route";
import { cookies } from "next/headers";
import { mockCookies as createMockCookies } from "tests/helpers";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

const mockCookies = createMockCookies("faiz-hakim");

describe("GET /api/meta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue(mockCookies);
  });

  it("returns meta data successfully", async () => {
    const response = await GET(new Request("http://localhost/api/meta"));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.stores).toBeDefined();
    expect(data.categories).toBeDefined();
  });

  it("returns 500 INTERNAL_ERROR when fail=1", async () => {
    const response = await GET(new Request("http://localhost/api/meta?fail=1"));
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("INTERNAL_ERROR");
  });

  it("does not fail when fail=0", async () => {
    const response = await GET(new Request("http://localhost/api/meta?fail=0"));
    expect(response.status).toBe(200);
  });
});
