import { vi } from "vitest";

vi.mock("server-only", () => ({}));

class MockAppError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string,
    public fieldErrors: Array<{ field: string; code: string; message: string }> = [],
  ) {
    super(message);
    this.name = "AppError";
  }
}

vi.mock("@/lib/domain/errors", () => ({
  AppError: MockAppError,
}));

vi.mock("@/lib/domain/policy", () => ({
  can: vi.fn((role: string, action: string) => {
    if (role === "manager") return true;
    if (role === "staff") {
      return ["view", "receive", "sell"].includes(action);
    }
    return false;
  }),
}));
