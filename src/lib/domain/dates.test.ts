import { describe, it, expect } from "vitest";
import { formatWhen, formatDateTime } from "./dates";

describe("formatWhen", () => {
  const now = new Date("2026-10-16T10:00:00");

  it("returns 'Xh ago' for times under 12 hours ago", () => {
    expect(formatWhen(new Date("2026-10-16T08:00:00"), now)).toBe("2h ago");
    expect(formatWhen(new Date("2026-10-16T09:30:00"), now)).toBe("30m ago");
    expect(formatWhen(new Date("2026-10-16T09:58:00"), now)).toBe("2m ago");
    expect(formatWhen(new Date("2026-10-16T09:59:59"), now)).toBe("1m ago");
  });

  it("returns 'Today, HH:MM' for same day", () => {
    expect(formatWhen(new Date("2026-10-16T09:10:00"), now)).toBe("Today, 09:10");
    expect(formatWhen(new Date("2026-10-16T00:00:00"), now)).toBe("Today, 00:00");
    expect(formatWhen(new Date("2026-10-16T23:59:00"), now)).toBe("Today, 23:59");
  });

  it("returns 'Yesterday' for the day before", () => {
    expect(formatWhen(new Date("2026-10-15T10:00:00"), now)).toBe("Yesterday");
    expect(formatWhen(new Date("2026-10-15T00:00:00"), now)).toBe("Yesterday");
    expect(formatWhen(new Date("2026-10-15T23:59:00"), now)).toBe("Yesterday");
  });

  it("returns 'D Mon' for older dates", () => {
    expect(formatWhen(new Date("2026-10-12T10:00:00"), now)).toBe("12 Oct");
    expect(formatWhen(new Date("2026-09-28T10:00:00"), now)).toBe("28 Sep");
    expect(formatWhen(new Date("2026-01-15T10:00:00"), now)).toBe("15 Jan");
  });

  it("handles string date input", () => {
    expect(formatWhen("2026-10-16T08:00:00", now)).toBe("2h ago");
    expect(formatWhen("2026-10-15T10:00:00", now)).toBe("Yesterday");
    expect(formatWhen("2026-10-12T10:00:00", now)).toBe("12 Oct");
  });
});

describe("formatDateTime", () => {
  it("formats date as 'D Mon, HH:MM' in 24-hour format", () => {
    expect(formatDateTime("2026-10-14T10:58:00")).toBe("14 Oct, 10:58");
    expect(formatDateTime(new Date("2026-10-14T10:58:00"))).toBe("14 Oct, 10:58");
  });

  it("handles midnight", () => {
    expect(formatDateTime("2026-10-14T00:00:00")).toBe("14 Oct, 00:00");
  });

  it("handles late night", () => {
    expect(formatDateTime("2026-10-14T23:59:00")).toBe("14 Oct, 23:59");
  });

  it("handles different months", () => {
    expect(formatDateTime("2026-09-28T14:30:00")).toBe("28 Sep, 14:30");
    expect(formatDateTime("2026-01-15T09:00:00")).toBe("15 Jan, 09:00");
  });
});
