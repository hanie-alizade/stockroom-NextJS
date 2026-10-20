import { describe, it, expect } from "vitest";
import {
  shouldSkipPrefetch,
  isFailRequested,
  isSlowRequested,
} from "../prefetch";
import { DEV_PARAM } from "@/constants";

describe("prefetch helpers (slow/fail checks)", () => {
  it("detects ?fail=1 correctly from plain object", () => {
    expect(isFailRequested({ [DEV_PARAM.FAIL]: DEV_PARAM.VALUE })).toBe(true);
    expect(isFailRequested({ fail: "1" })).toBe(true);
    expect(isFailRequested({ fail: "2" })).toBe(false);
    expect(isFailRequested({ fail: "" })).toBe(false);
    expect(isFailRequested({})).toBe(false);
    expect(isFailRequested(undefined)).toBe(false);
    expect(isFailRequested(null)).toBe(false);
  });

  it("detects ?slow=1 correctly from plain object", () => {
    expect(isSlowRequested({ [DEV_PARAM.SLOW]: DEV_PARAM.VALUE })).toBe(true);
    expect(isSlowRequested({ slow: "1" })).toBe(true);
    expect(isSlowRequested({ slow: "true" })).toBe(false);
    expect(isSlowRequested({})).toBe(false);
    expect(isSlowRequested(undefined)).toBe(false);
  });

  it("works with URLSearchParams", () => {
    const params = new URLSearchParams("slow=1");
    expect(isSlowRequested(params)).toBe(true);
    expect(isFailRequested(params)).toBe(false);
    expect(shouldSkipPrefetch(params)).toBe(true);

    const failParams = new URLSearchParams("fail=1");
    expect(isFailRequested(failParams)).toBe(true);
    expect(shouldSkipPrefetch(failParams)).toBe(true);

    const empty = new URLSearchParams();
    expect(shouldSkipPrefetch(empty)).toBe(false);
  });

  it("handles string arrays in record values", () => {
    expect(isSlowRequested({ slow: ["1", "2"] })).toBe(true);
    expect(isFailRequested({ fail: ["0"] })).toBe(false);
  });

  it("shouldSkipPrefetch returns true if either ?slow=1 or ?fail=1 is present", () => {
    expect(shouldSkipPrefetch({ slow: "1" })).toBe(true);
    expect(shouldSkipPrefetch({ fail: "1" })).toBe(true);
    expect(shouldSkipPrefetch({ slow: "1", fail: "1" })).toBe(true);
    expect(shouldSkipPrefetch({ slow: "0", fail: "0" })).toBe(false);
    expect(shouldSkipPrefetch({})).toBe(false);
    expect(shouldSkipPrefetch(undefined)).toBe(false);
  });
});
