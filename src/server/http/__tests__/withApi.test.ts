import { describe, it, expect, beforeEach, vi } from "vitest";
import { z } from "zod";
import { withApi } from "../withApi";
import { cookies } from "next/headers";
import { createRepository } from "@/server/repositories";
import { mockCookies, mockRepository } from "tests/helpers";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/server/repositories", () => ({
  createRepository: vi.fn(),
}));

describe("withApi", () => {
  beforeEach(() => {
    process.env.SIMULATED_LATENCY_MS = "0";
    vi.clearAllMocks();
    vi.mocked(createRepository).mockReturnValue(mockRepository());
  });

  describe("user from cookie", () => {
    it("uses manager user when cookie has aina-rahman", async () => {
      vi.mocked(cookies).mockResolvedValue(mockCookies("aina-rahman"));

      const handler = vi.fn(async ({ user }) => ({ userId: user.id }));
      await withApi(new Request("http://localhost"), handler);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({ id: "aina-rahman", role: "manager" }),
        }),
      );
    });

    it("uses staff user when cookie has faiz-hakim", async () => {
      vi.mocked(cookies).mockResolvedValue(mockCookies("faiz-hakim"));

      const handler = vi.fn(async ({ user }) => ({ userId: user.id }));
      await withApi(new Request("http://localhost"), handler);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({ id: "faiz-hakim", role: "staff" }),
        }),
      );
    });

    it("falls back to staff user faiz-hakim when cookie is missing", async () => {
      vi.mocked(cookies).mockResolvedValue(mockCookies());

      const handler = vi.fn(async ({ user }) => ({ userId: user.id }));
      await withApi(new Request("http://localhost"), handler);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({ id: "faiz-hakim", role: "staff" }),
        }),
      );
    });

    it("falls back to staff user faiz-hakim when cookie has unknown user id", async () => {
      vi.mocked(cookies).mockResolvedValue(mockCookies("unknown-user"));

      const handler = vi.fn(async ({ user }) => ({ userId: user.id }));
      await withApi(new Request("http://localhost"), handler);

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
      const response = await withApi(new Request("http://localhost"), handler, {
        permission: "write_off",
      });

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
      const response = await withApi(new Request("http://localhost"), handler, {
        permission: "transfer",
      });

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
      const response = await withApi(new Request("http://localhost"), handler, {
        permission: "import",
      });

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
      const response = await withApi(new Request("http://localhost"), handler, {
        permission: "write_off",
      });

      expect(response.status).toBe(200);
      expect(handler).toHaveBeenCalled();
    });

    it("allows manager to perform transfer", async () => {
      vi.mocked(cookies).mockResolvedValue(mockCookies("aina-rahman"));

      const handler = vi.fn(async () => ({ success: true }));
      const response = await withApi(new Request("http://localhost"), handler, {
        permission: "transfer",
      });

      expect(response.status).toBe(200);
      expect(handler).toHaveBeenCalled();
    });

    it("allows manager to perform import", async () => {
      vi.mocked(cookies).mockResolvedValue(mockCookies("aina-rahman"));

      const handler = vi.fn(async () => ({ success: true }));
      const response = await withApi(new Request("http://localhost"), handler, {
        permission: "import",
      });

      expect(response.status).toBe(200);
      expect(handler).toHaveBeenCalled();
    });
  });

  describe("?fail=1 forced failure", () => {
    it("returns 500 INTERNAL_ERROR when ?fail=1 is present", async () => {
      vi.mocked(cookies).mockResolvedValue(mockCookies("faiz-hakim"));

      const handler = vi.fn(async () => ({ success: true }));
      const response = await withApi(new Request("http://localhost?fail=1"), handler);

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

      const handler = vi.fn(async () => ({ success: true }));
      await withApi(new Request("http://localhost?fail=1"), handler);

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("error mapping", () => {
    it("maps missing value Zod issue to REQUIRED", async () => {
      vi.mocked(cookies).mockResolvedValue(mockCookies("faiz-hakim"));
      const schema = z.object({ name: z.string() });
      const handler = vi.fn(async () => schema.parse({}));
      const response = await withApi(new Request("http://localhost"), handler);

      expect(response.status).toBe(422);
      const body = await response.json();
      expect(body.error).toBe("VALIDATION_ERROR");
      expect(body.fieldErrors[0]).toMatchObject({
        field: "name",
        code: "REQUIRED",
      });
    });

    it("maps non-integer number Zod issue to NOT_A_WHOLE_NUMBER", async () => {
      vi.mocked(cookies).mockResolvedValue(mockCookies("faiz-hakim"));
      const schema = z.object({ qty: z.number().int() });
      const handler = vi.fn(async () => schema.parse({ qty: 1.5 }));
      const response = await withApi(new Request("http://localhost"), handler);

      expect(response.status).toBe(422);
      const body = await response.json();
      expect(body.fieldErrors[0]).toMatchObject({
        field: "qty",
        code: "NOT_A_WHOLE_NUMBER",
      });
    });

    it("maps number <= 0 Zod issue to MUST_BE_POSITIVE", async () => {
      vi.mocked(cookies).mockResolvedValue(mockCookies("faiz-hakim"));
      const schema = z.object({ qty: z.number().positive() });
      const handler = vi.fn(async () => schema.parse({ qty: 0 }));
      const response = await withApi(new Request("http://localhost"), handler);

      expect(response.status).toBe(422);
      const body = await response.json();
      expect(body.fieldErrors[0]).toMatchObject({
        field: "qty",
        code: "MUST_BE_POSITIVE",
      });
    });

    it("maps string too short Zod issue to TOO_SHORT", async () => {
      vi.mocked(cookies).mockResolvedValue(mockCookies("faiz-hakim"));
      const schema = z.object({ note: z.string().min(3) });
      const handler = vi.fn(async () => schema.parse({ note: "ab" }));
      const response = await withApi(new Request("http://localhost"), handler);

      expect(response.status).toBe(422);
      const body = await response.json();
      expect(body.fieldErrors[0]).toMatchObject({
        field: "note",
        code: "TOO_SHORT",
      });
    });

    it("maps string too long Zod issue to TOO_LONG", async () => {
      vi.mocked(cookies).mockResolvedValue(mockCookies("faiz-hakim"));
      const schema = z.object({ note: z.string().max(5) });
      const handler = vi.fn(async () => schema.parse({ note: "toolong" }));
      const response = await withApi(new Request("http://localhost"), handler);

      expect(response.status).toBe(422);
      const body = await response.json();
      expect(body.fieldErrors[0]).toMatchObject({
        field: "note",
        code: "TOO_LONG",
      });
    });

    it("maps other Zod issue to VALIDATION_ERROR", async () => {
      vi.mocked(cookies).mockResolvedValue(mockCookies("faiz-hakim"));
      const schema = z.object({ email: z.string().email() });
      const handler = vi.fn(async () => schema.parse({ email: "invalid-email" }));
      const response = await withApi(new Request("http://localhost"), handler);

      expect(response.status).toBe(422);
      const body = await response.json();
      expect(body.fieldErrors[0]).toMatchObject({
        field: "email",
        code: "VALIDATION_ERROR",
      });
    });

    it.todo(
      "maps AppError to standard error shape (blocked: with-api.ts uses type-only import, cannot test instanceof without modifying implementation)",
    );

    it.todo(
      "maps unexpected error to INTERNAL_ERROR (blocked: with-api.ts uses type-only import, cannot test instanceof without modifying implementation)",
    );
  });

  describe("success case", () => {
    it("returns handler result as JSON", async () => {
      vi.mocked(cookies).mockResolvedValue(mockCookies("faiz-hakim"));

      const handler = vi.fn(async () => ({ success: true, data: "test" }));
      const response = await withApi(new Request("http://localhost"), handler);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({ success: true, data: "test" });
    });
  });
});
