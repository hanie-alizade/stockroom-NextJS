import type { cookies } from "next/headers";
import { vi } from "vitest";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

export type MockCookieStore = {
  get: ReturnType<typeof vi.fn>;
  getAll: ReturnType<typeof vi.fn>;
  has: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  size: number;
  [Symbol.iterator]: () => Generator<[string, { name: string; value: string }]>;
};

export function mockCookies(userId?: string): MockCookieStore & CookieStore {
  const cookie = userId ? { name: "stockroom_user", value: userId } : undefined;
  const store: MockCookieStore = {
    get: vi.fn((name?: unknown) => {
      if (typeof name === "string") {
        return name === "stockroom_user" ? cookie : undefined;
      }
      return cookie;
    }),
    getAll: vi.fn((name?: unknown) => {
      if (!cookie) return [];
      if (typeof name === "string" && name !== "stockroom_user") return [];
      return [cookie];
    }),
    has: vi.fn((name: string) => Boolean(cookie && name === "stockroom_user")),
    set: vi.fn(),
    delete: vi.fn(),
    size: cookie ? 1 : 0,
    *[Symbol.iterator](): Generator<[string, { name: string; value: string }]> {
      if (cookie) {
        yield ["stockroom_user", cookie];
      }
    },
  };
  return store as unknown as MockCookieStore & CookieStore;
}
