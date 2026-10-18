import { describe, it, expect, beforeEach, vi } from "vitest";
import { withApi } from "./withApi";
import { cookies } from "next/headers";
import { createRepository } from "@/server/repositories";
import { mockCookies, mockRepository } from "tests/helpers";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/server/repositories", () => ({
  createRepository: vi.fn(),
}));

declare global {
  var url: string | URL | undefined;
}

describe("withApi", () => {
  beforeEach(() => {
    process.env.SIMULATED_LATENCY_MS = "0";
    vi.clearAllMocks();
    globalThis.url = new URL("http://localhost");
    vi.mocked(createRepository).mockReturnValue(mockRepository());
  });

  describe("user from cookie", () => {
    it("uses manager user when cookie has aina-rahman", async () => {
      vi.mocked(cookies).mockResolvedValue(mockCookies("aina-rahman"));

      const handler = vi.fn(async ({ user }) => ({ userId: user.id }));
      await withApi(handler);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({ id: "aina-rahman", role: "manager" }),
        }),
      );
    });

    it("uses staff user when cookie has faiz-hakim", async () => {
      vi.mocked(cookies).mockResolvedValue(mockCookies("faiz-hakim"));

      const handler = vi.fn(async ({ user }) => ({ userId: user.id }));
      await withApi(handler);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({ id: "faiz-hakim", role: "staff" }),
        }),
      );
    });

    it("falls back to staff user faiz-hakim when cookie is missing", async () => {
      vi.mocked(cookies).mockResolvedValue(mockCookies());

      const handler = vi.fn(async ({ user }) => ({ userId: user.id }));
      await withApi(handler);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({ id: "faiz-hakim", role: "staff" }),
        }),
      );
    });

    it("falls back to staff user faiz-hakim when cookie has unknown user id", async () => {
      vi.mocked(cookies).mockResolvedValue(mockCookies("unknown-user"));

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
      vi.mocked(cookies).mockResolvedValue(mockCookies("faiz-hakim"));

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
      vi.mocked(cookies).mockResolvedValue(mockCookies("faiz-hakim"));

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
      vi.mocked(cookies).mockResolvedValue(mockCookies("faiz-hakim"));

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
      vi.mocked(cookies).mockResolvedValue(mockCookies("aina-rahman"));

      const handler = vi.fn(async () => ({ success: true }));
      const response = await withApi(handler, { action: "write_off" });

      expect(response.status).toBe(200);
      expect(handler).toHaveBeenCalled();
    });

    it("allows manager to perform transfer", async () => {
      vi.mocked(cookies).mockResolvedValue(mockCookies("aina-rahman"));

      const handler = vi.fn(async () => ({ success: true }));
      const response = await withApi(handler, { action: "transfer" });

      expect(response.status).toBe(200);
      expect(handler).toHaveBeenCalled();
    });

    it("allows manager to perform import", async () => {
      vi.mocked(cookies).mockResolvedValue(mockCookies("aina-rahman"));

      const handler = vi.fn(async () => ({ success: true }));
      const response = await withApi(handler, { action: "import" });

      expect(response.status).toBe(200);
      expect(handler).toHaveBeenCalled();
    });
  });

  describe("?fail=1 forced failure", () => {
    it("returns 500 INTERNAL_ERROR when ?fail=1 is present", async () => {
      vi.mocked(cookies).mockResolvedValue(mockCookies("faiz-hakim"));

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
      vi.mocked(cookies).mockResolvedValue(mockCookies("faiz-hakim"));

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
      vi.mocked(cookies).mockResolvedValue(mockCookies("faiz-hakim"));

      const handler = vi.fn(async () => ({ success: true, data: "test" }));
      const response = await withApi(handler);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({ success: true, data: "test" });
    });
  });
});
