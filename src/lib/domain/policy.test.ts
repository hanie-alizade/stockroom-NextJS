import { describe, it, expect } from "vitest";
import { can, type Role, type Action } from "./policy";

describe("can", () => {
  describe("staff role", () => {
    it("allows view", () => {
      expect(can("staff", "view")).toBe(true);
    });

    it("allows receive", () => {
      expect(can("staff", "receive")).toBe(true);
    });

    it("allows sell", () => {
      expect(can("staff", "sell")).toBe(true);
    });

    it("denies write_off", () => {
      expect(can("staff", "write_off")).toBe(false);
    });

    it("denies transfer", () => {
      expect(can("staff", "transfer")).toBe(false);
    });

    it("denies import", () => {
      expect(can("staff", "import")).toBe(false);
    });
  });

  describe("manager role", () => {
    it("allows view", () => {
      expect(can("manager", "view")).toBe(true);
    });

    it("allows receive", () => {
      expect(can("manager", "receive")).toBe(true);
    });

    it("allows sell", () => {
      expect(can("manager", "sell")).toBe(true);
    });

    it("allows write_off", () => {
      expect(can("manager", "write_off")).toBe(true);
    });

    it("allows transfer", () => {
      expect(can("manager", "transfer")).toBe(true);
    });

    it("allows import", () => {
      expect(can("manager", "import")).toBe(true);
    });
  });
});
