import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "./route";
import { cookies } from "next/headers";

import { mockCookies as createMockCookies } from "tests/helpers";

// next/headers has no request scope in vitest; withApi reads the cookie here.
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

const mockCookies = createMockCookies("faiz-hakim");

describe("POST /api/session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue(mockCookies);
    mockCookies.set.mockClear();
  });

  it("sets the cookie and returns the user for a valid userId", async () => {
    const request = new Request("http://localhost/api/session", {
      method: "POST",
      body: JSON.stringify({ userId: "aina-rahman" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user.id).toBe("aina-rahman");
    expect(data.user.name).toBe("Aina Rahman");
    expect(data.user.role).toBe("manager");
    expect(mockCookies.set).toHaveBeenCalledWith("stockroom_user", "aina-rahman", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
  });

  it("returns 422 VALIDATION_ERROR for unknown userId", async () => {
    const request = new Request("http://localhost/api/session", {
      method: "POST",
      body: JSON.stringify({ userId: "unknown-user" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error).toBe("VALIDATION_ERROR");
    expect(data.fieldErrors).toEqual([
      { field: "userId", code: "UNKNOWN_USER", message: "Unknown user." },
    ]);
    expect(mockCookies.set).not.toHaveBeenCalled();
  });

  it("returns 400 INVALID_JSON for invalid JSON body", async () => {
    const request = new Request("http://localhost/api/session", {
      method: "POST",
      body: "not valid json",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("INVALID_JSON");
    expect(data.message).toBe("Invalid JSON body");
    expect(mockCookies.set).not.toHaveBeenCalled();
  });
});
