import { describe, it, expect, beforeEach, vi } from "vitest";
import { getCurrentUser } from "./session";
import { cookies } from "next/headers";
import { createRepository } from "@/lib/server/repo";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/server/repo", () => ({
  createRepository: vi.fn(),
}));

type MockUser = { id: string; name: string; initials: string; role: "manager" | "staff" };

type MockCookies = {
  get: (name: string) => { value: string } | undefined;
  size: number;
  getAll: (name?: string) => Array<{ value: string }>;
  has: (name: string) => boolean;
};

describe("getCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns manager user when cookie has aina-rahman", async () => {
    const mockRepo = {
      getUsers: vi.fn((): MockUser[] => [
        { id: "aina-rahman", name: "Aina Rahman", initials: "AR", role: "manager" },
        { id: "faiz-hakim", name: "Faiz Hakim", initials: "FH", role: "staff" },
      ]),
    };
    vi.mocked(createRepository).mockReturnValue(mockRepo as any);
    const mockCookies: MockCookies = {
      get: vi.fn(() => ({ value: "aina-rahman" })),
      size: 1,
      getAll: vi.fn(() => [{ value: "aina-rahman" }]),
      has: vi.fn(() => true),
    };
    vi.mocked(cookies).mockResolvedValue(mockCookies as any);

    const user = await getCurrentUser();

    expect(user).toEqual({
      id: "aina-rahman",
      name: "Aina Rahman",
      initials: "AR",
      role: "manager",
    });
  });

  it("returns staff user when cookie has faiz-hakim", async () => {
    const mockRepo = {
      getUsers: vi.fn((): MockUser[] => [
        { id: "aina-rahman", name: "Aina Rahman", initials: "AR", role: "manager" },
        { id: "faiz-hakim", name: "Faiz Hakim", initials: "FH", role: "staff" },
      ]),
    };
    vi.mocked(createRepository).mockReturnValue(mockRepo as any);
    const mockCookies: MockCookies = {
      get: vi.fn(() => ({ value: "faiz-hakim" })),
      size: 1,
      getAll: vi.fn(() => [{ value: "faiz-hakim" }]),
      has: vi.fn(() => true),
    };
    vi.mocked(cookies).mockResolvedValue(mockCookies as any);

    const user = await getCurrentUser();

    expect(user).toEqual({
      id: "faiz-hakim",
      name: "Faiz Hakim",
      initials: "FH",
      role: "staff",
    });
  });

  it("falls back to staff user faiz-hakim when cookie is missing", async () => {
    const mockRepo = {
      getUsers: vi.fn((): MockUser[] => [
        { id: "aina-rahman", name: "Aina Rahman", initials: "AR", role: "manager" },
        { id: "faiz-hakim", name: "Faiz Hakim", initials: "FH", role: "staff" },
      ]),
    };
    vi.mocked(createRepository).mockReturnValue(mockRepo as any);
    const mockCookies: MockCookies = {
      get: vi.fn(() => undefined),
      size: 0,
      getAll: vi.fn(() => []),
      has: vi.fn(() => false),
    };
    vi.mocked(cookies).mockResolvedValue(mockCookies as any);

    const user = await getCurrentUser();

    expect(user).toEqual({
      id: "faiz-hakim",
      name: "Faiz Hakim",
      initials: "FH",
      role: "staff",
    });
  });

  it("falls back to staff user faiz-hakim when cookie has unknown user id", async () => {
    const mockRepo = {
      getUsers: vi.fn((): MockUser[] => [
        { id: "aina-rahman", name: "Aina Rahman", initials: "AR", role: "manager" },
        { id: "faiz-hakim", name: "Faiz Hakim", initials: "FH", role: "staff" },
      ]),
    };
    vi.mocked(createRepository).mockReturnValue(mockRepo as any);
    const mockCookies: MockCookies = {
      get: vi.fn(() => ({ value: "unknown-user" })),
      size: 1,
      getAll: vi.fn(() => [{ value: "unknown-user" }]),
      has: vi.fn(() => true),
    };
    vi.mocked(cookies).mockResolvedValue(mockCookies as any);

    const user = await getCurrentUser();

    expect(user).toEqual({
      id: "faiz-hakim",
      name: "Faiz Hakim",
      initials: "FH",
      role: "staff",
    });
  });
});
