import { describe, it, expect } from "vitest";
import { formatWhen, formatDateTime } from "./dates";

const MORNING = new Date("2026-10-16T10:00:00+08:00");
const EVENING = new Date("2026-10-16T22:00:00+08:00");

describe("formatWhen", () => {
  describe("Just now", () => {
    it("returns 'Just now' at 0 seconds", () => {
      const input = new Date("2026-10-16T10:00:00+08:00");

      const result = formatWhen(input, MORNING);

      expect(result).toBe("Just now");
    });

    it("returns 'Just now' at 59 seconds", () => {
      const input = new Date("2026-10-16T09:59:01+08:00");

      const result = formatWhen(input, MORNING);

      expect(result).toBe("Just now");
    });

    it("returns 'Just now' for an input 1 minute in the future", () => {
      const input = new Date("2026-10-16T10:01:00+08:00");

      const result = formatWhen(input, MORNING);

      expect(result).toBe("Just now");
    });
  });

  describe("minutes ago", () => {
    it("returns '1m ago' at 60 seconds", () => {
      const input = new Date("2026-10-16T09:59:00+08:00");

      const result = formatWhen(input, MORNING);

      expect(result).toBe("1m ago");
    });

    it("returns '59m ago' at 59 minutes 59 seconds", () => {
      const input = new Date("2026-10-16T09:00:01+08:00");

      const result = formatWhen(input, MORNING);

      expect(result).toBe("59m ago");
    });
  });

  describe("hours ago", () => {
    it("returns '1h ago' at 60 minutes", () => {
      const input = new Date("2026-10-16T09:00:00+08:00");

      const result = formatWhen(input, MORNING);

      expect(result).toBe("1h ago");
    });

    it("returns '11h ago' at 11 hours 59 minutes", () => {
      const input = new Date("2026-10-16T10:01:00+08:00");

      const result = formatWhen(input, EVENING);

      expect(result).toBe("11h ago");
    });
  });

  describe("Today, HH:MM", () => {
    it("returns 'Today, 10:00' at exactly 12 hours before EVENING", () => {
      const input = new Date("2026-10-16T10:00:00+08:00");

      const result = formatWhen(input, EVENING);

      expect(result).toBe("Today, 10:00");
    });

    it("returns 'Today, 09:10' for 09:10 with EVENING", () => {
      const input = new Date("2026-10-16T09:10:00+08:00");

      const result = formatWhen(input, EVENING);

      expect(result).toBe("Today, 09:10");
    });

    it("returns '10h ago' for 00:00 with MORNING (same day, 10 hours)", () => {
      const input = new Date("2026-10-16T00:00:00+08:00");

      const result = formatWhen(input, MORNING);

      expect(result).toBe("10h ago");
    });
  });

  describe("Yesterday", () => {
    it("returns 'Yesterday' for 2026-10-15 23:59 with MORNING", () => {
      const input = new Date("2026-10-15T23:59:00+08:00");

      const result = formatWhen(input, MORNING);

      expect(result).toBe("Yesterday");
    });

    it("returns 'Yesterday' for 2026-10-15 00:00 with MORNING", () => {
      const input = new Date("2026-10-15T00:00:00+08:00");

      const result = formatWhen(input, MORNING);

      expect(result).toBe("Yesterday");
    });

    it("returns 'Yesterday' across a month boundary (now 1 Nov, input 31 Oct)", () => {
      const now = new Date("2026-11-01T10:00:00+08:00");
      const input = new Date("2026-10-31T23:59:00+08:00");

      const result = formatWhen(input, now);

      expect(result).toBe("Yesterday");
    });

    it("returns 'Yesterday' across a year boundary (now 1 Jan 2027, input 31 Dec 2026)", () => {
      const now = new Date("2027-01-01T10:00:00+08:00");
      const input = new Date("2026-12-31T23:59:00+08:00");

      const result = formatWhen(input, now);

      expect(result).toBe("Yesterday");
    });
  });

  describe("older dates in same year", () => {
    it("returns '12 Oct' for older date in same year", () => {
      const input = new Date("2026-10-12T10:00:00+08:00");

      const result = formatWhen(input, MORNING);

      expect(result).toBe("12 Oct");
    });

    it("returns '28 Sep' for older date in same year", () => {
      const input = new Date("2026-09-28T10:00:00+08:00");

      const result = formatWhen(input, MORNING);

      expect(result).toBe("28 Sep");
    });
  });

  describe("dates in another year", () => {
    it("returns '30 Dec 2025' style text for date in another year", () => {
      const input = new Date("2025-12-30T10:00:00+08:00");

      const result = formatWhen(input, MORNING);

      expect(result).toBe("30 Dec 2025");
    });
  });

  describe("time zone handling", () => {
    it("uses the app time zone: input 2026-10-15T17:00:00Z (16 Oct 01:00 in KL) with MORNING returns '9h ago'", () => {
      const input = "2026-10-15T17:00:00Z";

      const result = formatWhen(input, MORNING);

      expect(result).toBe("9h ago");
    });
  });

  describe("input types", () => {
    it("gives the same text for a Date and for the same moment as an ISO string", () => {
      const inputDate = new Date("2026-10-16T08:00:00+08:00");
      const inputString = "2026-10-16T08:00:00+08:00";

      const resultDate = formatWhen(inputDate, MORNING);
      const resultString = formatWhen(inputString, MORNING);

      expect(resultDate).toBe(resultString);
    });
  });

  describe("error handling", () => {
    it("throws RangeError for 'not a date'", () => {
      expect(() => formatWhen("not a date", MORNING)).toThrow(RangeError);
    });

    it("throws RangeError for new Date(NaN)", () => {
      const input = new Date(NaN);

      expect(() => formatWhen(input, MORNING)).toThrow(RangeError);
    });
  });
});

describe("formatDateTime", () => {
  it("formats 2026-10-14T10:58:00+08:00 as '14 Oct, 10:58'", () => {
    const input = "2026-10-14T10:58:00+08:00";

    const result = formatDateTime(input);

    expect(result).toBe("14 Oct, 10:58");
  });

  it("formats midnight as '14 Oct, 00:00'", () => {
    const input = "2026-10-14T00:00:00+08:00";

    const result = formatDateTime(input);

    expect(result).toBe("14 Oct, 00:00");
  });

  it("formats 23:59 as '14 Oct, 23:59'", () => {
    const input = "2026-10-14T23:59:00+08:00";

    const result = formatDateTime(input);

    expect(result).toBe("14 Oct, 23:59");
  });

  it("converts to the app time zone: 2026-10-14T16:00:00Z returns '15 Oct, 00:00'", () => {
    const input = "2026-10-14T16:00:00Z";

    const result = formatDateTime(input);

    expect(result).toBe("15 Oct, 00:00");
  });

  it("accepts Date and string with the same result", () => {
    const inputDate = new Date("2026-10-14T10:58:00+08:00");
    const inputString = "2026-10-14T10:58:00+08:00";

    const resultDate = formatDateTime(inputDate);
    const resultString = formatDateTime(inputString);

    expect(resultDate).toBe(resultString);
  });

  it("throws RangeError for an invalid input", () => {
    expect(() => formatDateTime("not a date")).toThrow(RangeError);
  });
});
