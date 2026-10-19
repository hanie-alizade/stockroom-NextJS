import { describe, it, expect } from "vitest";
import { roleHasPermission, type Role, type Permission } from "../policy";

describe("roleHasPermission", () => {
  describe("staff role", () => {
    it("allows view", () => {
      expect(roleHasPermission("staff", "view")).toBe(true);
    });

    it("allows receive", () => {
      expect(roleHasPermission("staff", "receive")).toBe(true);
    });

    it("allows sell", () => {
      expect(roleHasPermission("staff", "sell")).toBe(true);
    });

    it("denies write_off", () => {
      expect(roleHasPermission("staff", "write_off")).toBe(false);
    });

    it("denies transfer", () => {
      expect(roleHasPermission("staff", "transfer")).toBe(false);
    });

    it("denies import", () => {
      expect(roleHasPermission("staff", "import")).toBe(false);
    });
  });

  describe("manager role", () => {
    it("allows view", () => {
      expect(roleHasPermission("manager", "view")).toBe(true);
    });

    it("allows receive", () => {
      expect(roleHasPermission("manager", "receive")).toBe(true);
    });

    it("allows sell", () => {
      expect(roleHasPermission("manager", "sell")).toBe(true);
    });

    it("allows write_off", () => {
      expect(roleHasPermission("manager", "write_off")).toBe(true);
    });

    it("allows transfer", () => {
      expect(roleHasPermission("manager", "transfer")).toBe(true);
    });

    it("allows import", () => {
      expect(roleHasPermission("manager", "import")).toBe(true);
    });
  });
});
