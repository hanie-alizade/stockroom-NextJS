/* eslint-disable @typescript-eslint/consistent-type-assertions */

/* eslint-disable max-lines */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { withApi } from "./with-api";
import { cookies } from "next/headers";
import { createRepository } from "@/lib/server/repo";
import { AppError } from "@/lib/domain/errors";
import type { Repository } from "@/lib/server/repo";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/server/repo", () => ({
  createRepository: vi.fn(),
}));

type MockRepository = Partial<Repository> & {
  getUsers: () => Array<{ id: string; name: string; initials: string; role: "manager" | "staff" }>;
};

type MockUser = { id: string; name: string; initials: string; role: "manager" | "staff" };

type MockCookies = {
  get: (name: string) => { value: string } | undefined;
  size: number;
  getAll: (name?: string) => Array<{ value: string }>;
  has: (name: string) => boolean;
  [Symbol.iterator]?: () => IterableIterator<[string, { value: string }]>;
};

declare global {
  var url: string | URL | undefined;
}

describe("withApi", () => {
  beforeEach(() => {
    process.env.SIMULATED_LATENCY_MS = "0";
    vi.clearAllMocks();
    globalThis.url = new URL("http://localhost");
  });

  describe("user from cookie", () => {
    it("uses manager user when cookie has aina-rahman", async () => {
      const mockRepo: MockRepository = {
        getUsers: vi.fn((): MockUser[] => [
          { id: "aina-rahman", name: "Aina Rahman", initials: "AR", role: "manager" },
          { id: "faiz-hakim", name: "Faiz Hakim", initials: "FH", role: "staff" },
        ]),
      };
      vi.mocked(createRepository).mockReturnValue(mockRepo as Repository);
      const mockCookies: MockCookies = {
        get: vi.fn(() => ({ value: "aina-rahman" })),
        size: 1,
        getAll: vi.fn(() => [{ value: "aina-rahman" }]),
        has: vi.fn(() => true),
      } as any;
      vi.mocked(cookies).mockResolvedValue(mockCookies as any);

      const handler = vi.fn(async ({ user }) => ({ userId: user.id }));
      await withApi(handler);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({ id: "aina-rahman", role: "manager" }),
        }),
      );
    });

    it("uses staff user when cookie has faiz-hakim", async () => {
      const mockRepo: MockRepository = {
        getUsers: vi.fn((): MockUser[] => [
          { id: "aina-rahman", name: "Aina Rahman", initials: "AR", role: "manager" },
          { id: "faiz-hakim", name: "Faiz Hakim", initials: "FH", role: "staff" },
        ]),
      };
      vi.mocked(createRepository).mockReturnValue(mockRepo as Repository);
      const mockCookies: MockCookies = {
        get: vi.fn(() => ({ value: "faiz-hakim" })),
        size: 1,
        getAll: vi.fn(() => [{ value: "faiz-hakim" }]),
        has: vi.fn(() => true),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookies as any);

      const handler = vi.fn(async ({ user }) => ({ userId: user.id }));
      await withApi(handler);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({ id: "faiz-hakim", role: "staff" }),
        }),
      );
    });

    it("falls back to staff user faiz-hakim when cookie is missing", async () => {
      const mockRepo: MockRepository = {
        getUsers: vi.fn((): MockUser[] => [
          { id: "aina-rahman", name: "Aina Rahman", initials: "AR", role: "manager" },
          { id: "faiz-hakim", name: "Faiz Hakim", initials: "FH", role: "staff" },
        ]),
      };
      vi.mocked(createRepository).mockReturnValue(mockRepo as Repository);
      const mockCookies: MockCookies = {
        get: vi.fn(() => undefined),
        size: 0,
        getAll: vi.fn(() => []),
        has: vi.fn(() => false),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookies as any);

      const handler = vi.fn(async ({ user }) => ({ userId: user.id }));
      await withApi(handler);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({ id: "faiz-hakim", role: "staff" }),
        }),
      );
    });

    it("falls back to staff user faiz-hakim when cookie has unknown user id", async () => {
      const mockRepo: MockRepository = {
        getUsers: vi.fn((): MockUser[] => [
          { id: "aina-rahman", name: "Aina Rahman", initials: "AR", role: "manager" },
          { id: "faiz-hakim", name: "Faiz Hakim", initials: "FH", role: "staff" },
        ]),
      };
      vi.mocked(createRepository).mockReturnValue(mockRepo as Repository);
      const mockCookies: MockCookies = {
        get: vi.fn(() => ({ value: "unknown-user" })),
        size: 1,
        getAll: vi.fn(() => [{ value: "unknown-user" }]),
        has: vi.fn(() => true),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookies as any);

      const handler = vi.fn(async ({ user }) => ({ userId: user.id }));
      await withApi(handler);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({ id: "faiz-hakim", role: "staff" }),
        }),
      );
    });
  });

  describe("authorization", () => {
    it("returns 403 FORBIDDEN when staff tries write_off", async () => {
      const mockRepo: MockRepository = {
        getUsers: vi.fn((): MockUser[] => [
          { id: "faiz-hakim", name: "Faiz Hakim", initials: "FH", role: "staff" },
        ]),
      };
      vi.mocked(createRepository).mockReturnValue(mockRepo as Repository);
      const mockCookies: MockCookies = {
        get: vi.fn(() => ({ value: "faiz-hakim" })),
        size: 1,
        getAll: vi.fn(() => [{ value: "faiz-hakim" }]),
        has: vi.fn(() => true),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookies as any);

      const handler = vi.fn();
      const response = await withApi(handler, { action: "write_off" });

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body).toEqual({
        error: "FORBIDDEN",
        message: "You do not have permission to perform this action",
        fieldErrors: [],
      });
      expect(handler).not.toHaveBeenCalled();
    });

    it("returns 403 FORBIDDEN when staff tries transfer", async () => {
      const mockRepo: MockRepository = {
        getUsers: vi.fn((): MockUser[] => [
          { id: "faiz-hakim", name: "Faiz Hakim", initials: "FH", role: "staff" },
        ]),
      };
      vi.mocked(createRepository).mockReturnValue(mockRepo as Repository);
      const mockCookies: MockCookies = {
        get: vi.fn(() => ({ value: "faiz-hakim" })),
        size: 1,
        getAll: vi.fn(() => [{ value: "faiz-hakim" }]),
        has: vi.fn(() => true),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookies as any);

      const handler = vi.fn();
      const response = await withApi(handler, { action: "transfer" });

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body).toEqual({
        error: "FORBIDDEN",
        message: "You do not have permission to perform this action",
        fieldErrors: [],
      });
      expect(handler).not.toHaveBeenCalled();
    });

    it("returns 403 FORBIDDEN when staff tries import", async () => {
      const mockRepo: MockRepository = {
        getUsers: vi.fn((): MockUser[] => [
          { id: "faiz-hakim", name: "Faiz Hakim", initials: "FH", role: "staff" },
        ]),
      };
      vi.mocked(createRepository).mockReturnValue(mockRepo as Repository);
      const mockCookies: MockCookies = {
        get: vi.fn(() => ({ value: "faiz-hakim" })),
        size: 1,
        getAll: vi.fn(() => [{ value: "faiz-hakim" }]),
        has: vi.fn(() => true),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookies as any);

      const handler = vi.fn();
      const response = await withApi(handler, { action: "import" });

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body).toEqual({
        error: "FORBIDDEN",
        message: "You do not have permission to perform this action",
        fieldErrors: [],
      });
      expect(handler).not.toHaveBeenCalled();
    });

    it("allows manager to perform write_off", async () => {
      const mockRepo: MockRepository = {
        getUsers: vi.fn((): MockUser[] => [
          { id: "aina-rahman", name: "Aina Rahman", initials: "AR", role: "manager" },
        ]),
      };
      vi.mocked(createRepository).mockReturnValue(mockRepo as Repository);
      const mockCookies: MockCookies = {
        get: vi.fn(() => ({ value: "aina-rahman" })),
        size: 1,
        getAll: vi.fn(() => [{ value: "aina-rahman" }]),
        has: vi.fn(() => true),
      } as any;
      vi.mocked(cookies).mockResolvedValue(mockCookies as any);

      const handler = vi.fn(async () => ({ success: true }));
      const response = await withApi(handler, { action: "write_off" });

      expect(response.status).toBe(200);
      expect(handler).toHaveBeenCalled();
    });

    it("allows manager to perform transfer", async () => {
      const mockRepo: MockRepository = {
        getUsers: vi.fn((): MockUser[] => [
          { id: "aina-rahman", name: "Aina Rahman", initials: "AR", role: "manager" },
        ]),
      };
      vi.mocked(createRepository).mockReturnValue(mockRepo as Repository);
      const mockCookies: MockCookies = {
        get: vi.fn(() => ({ value: "aina-rahman" })),
        size: 1,
        getAll: vi.fn(() => [{ value: "aina-rahman" }]),
        has: vi.fn(() => true),
      } as any;
      vi.mocked(cookies).mockResolvedValue(mockCookies as any);

      const handler = vi.fn(async () => ({ success: true }));
      const response = await withApi(handler, { action: "transfer" });

      expect(response.status).toBe(200);
      expect(handler).toHaveBeenCalled();
    });

    it("allows manager to perform import", async () => {
      const mockRepo: MockRepository = {
        getUsers: vi.fn((): MockUser[] => [
          { id: "aina-rahman", name: "Aina Rahman", initials: "AR", role: "manager" },
        ]),
      };
      vi.mocked(createRepository).mockReturnValue(mockRepo as Repository);
      const mockCookies: MockCookies = {
        get: vi.fn(() => ({ value: "aina-rahman" })),
        size: 1,
        getAll: vi.fn(() => [{ value: "aina-rahman" }]),
        has: vi.fn(() => true),
      } as any;
      vi.mocked(cookies).mockResolvedValue(mockCookies as any);

      const handler = vi.fn(async () => ({ success: true }));
      const response = await withApi(handler, { action: "import" });

      expect(response.status).toBe(200);
      expect(handler).toHaveBeenCalled();
    });
  });

  describe("?fail=1 forced failure", () => {
    it("returns 500 INTERNAL_ERROR when ?fail=1 is present", async () => {
      const mockRepo: MockRepository = {
        getUsers: vi.fn((): MockUser[] => [
          { id: "faiz-hakim", name: "Faiz Hakim", initials: "FH", role: "staff" },
        ]),
      };
      vi.mocked(createRepository).mockReturnValue(mockRepo as Repository);
      const mockCookies: MockCookies = {
        get: vi.fn(() => ({ value: "faiz-hakim" })),
        size: 1,
        getAll: vi.fn(() => [{ value: "faiz-hakim" }]),
        has: vi.fn(() => true),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookies as any);

      globalThis.url = new URL("http://localhost?fail=1");

      const handler = vi.fn(async () => ({ success: true }));
      const response = await withApi(handler);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({
        error: "INTERNAL_ERROR",
        message: "Forced failure",
        fieldErrors: [],
      });
      expect(handler).not.toHaveBeenCalled();
    });

    it("does not run handler when ?fail=1 is present", async () => {
      const mockRepo: MockRepository = {
        getUsers: vi.fn((): MockUser[] => [
          { id: "faiz-hakim", name: "Faiz Hakim", initials: "FH", role: "staff" },
        ]),
      };
      vi.mocked(createRepository).mockReturnValue(mockRepo as Repository);
      const mockCookies: MockCookies = {
        get: vi.fn(() => ({ value: "faiz-hakim" })),
        size: 1,
        getAll: vi.fn(() => [{ value: "faiz-hakim" }]),
        has: vi.fn(() => true),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookies as any);

      globalThis.url = new URL("http://localhost?fail=1");

      const handler = vi.fn(async () => ({ success: true }));
      await withApi(handler);

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("error mapping", () => {
    it.todo(
      "maps AppError to standard error shape (blocked: with-api.ts uses type-only import, cannot test instanceof without modifying implementation)",
    );

    it.todo(
      "maps ZodError to VALIDATION_ERROR with fieldErrors (blocked: with-api.ts uses type-only import, cannot test instanceof without modifying implementation)",
    );

    it.todo(
      "maps unexpected error to INTERNAL_ERROR (blocked: with-api.ts uses type-only import, cannot test instanceof without modifying implementation)",
    );
  });

  describe("success case", () => {
    it("returns handler result as JSON", async () => {
      const mockRepo: MockRepository = {
        getUsers: vi.fn((): MockUser[] => [
          { id: "faiz-hakim", name: "Faiz Hakim", initials: "FH", role: "staff" },
        ]),
      };
      vi.mocked(createRepository).mockReturnValue(mockRepo as Repository);
      const mockCookies: MockCookies = {
        get: vi.fn(() => ({ value: "faiz-hakim" })),
        size: 1,
        getAll: vi.fn(() => [{ value: "faiz-hakim" }]),
        has: vi.fn(() => true),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookies as any);

      const handler = vi.fn(async () => ({ success: true, data: "test" }));
      const response = await withApi(handler);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({ success: true, data: "test" });
    });
  });
});
