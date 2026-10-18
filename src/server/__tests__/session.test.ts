import { describe, it, expect, beforeEach, vi } from "vitest";
import { getCurrentUser } from "../session";
import { cookies } from "next/headers";
import { createRepository } from "@/server/repositories";
import { mockCookies, mockRepository } from "tests/helpers";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/server/repositories", () => ({
  createRepository: vi.fn(),
}));

describe("getCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createRepository).mockReturnValue(mockRepository());
  });

  it("returns manager user when cookie has aina-rahman", async () => {
    vi.mocked(cookies).mockResolvedValue(mockCookies("aina-rahman"));

    const user = await getCurrentUser();

    expect(user).toEqual({
      id: "aina-rahman",
      name: "Aina Rahman",
      initials: "AR",
      role: "manager",
    });
  });

  it("returns staff user when cookie has faiz-hakim", async () => {
    vi.mocked(cookies).mockResolvedValue(mockCookies("faiz-hakim"));

    const user = await getCurrentUser();

    expect(user).toEqual({
      id: "faiz-hakim",
      name: "Faiz Hakim",
      initials: "FH",
      role: "staff",
    });
  });

  it("falls back to staff user faiz-hakim when cookie is missing", async () => {
    vi.mocked(cookies).mockResolvedValue(mockCookies());

    const user = await getCurrentUser();

    expect(user).toEqual({
      id: "faiz-hakim",
      name: "Faiz Hakim",
      initials: "FH",
      role: "staff",
    });
  });

  it("falls back to staff user faiz-hakim when cookie has unknown user id", async () => {
    vi.mocked(cookies).mockResolvedValue(mockCookies("unknown-user"));

    const user = await getCurrentUser();

    expect(user).toEqual({
      id: "faiz-hakim",
      name: "Faiz Hakim",
      initials: "FH",
      role: "staff",
    });
  });
});
