import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { IMPORT_FIELD } from "@/constants";
import { autoMatchColumns, parseCsv } from "@/helpers";
import { createRepository } from "@/server/repositories";
import type { ImportMapping } from "@/types";
import type { ImportFileInput } from "../types";
import { validateImport } from "../validateImport";

describe("validateImport", () => {
  const repo = createRepository();

  const defaultMapping: ImportMapping = {
    [IMPORT_FIELD.SKU]: "SKU",
    [IMPORT_FIELD.NAME]: "Name",
    [IMPORT_FIELD.CATEGORY]: "Category",
    [IMPORT_FIELD.QUANTITY]: "Quantity",
    [IMPORT_FIELD.UNIT_COST]: "Unit cost",
  };

  beforeEach(() => {
    repo.reset();
  });

  describe("validateImport", () => {
    it("computes correct summary numbers for valid, invalid, creates, and updates", () => {
      // Seed product: KL-1042 exists.
      // NEW-ITEM is new.
      // BAD-ITEM has invalid quantity.
      // Use real category from seed: "Coffee"
      const csv = [
        "SKU,Name,Category,Quantity,Unit cost",
        "KL-1042,Espresso Roast,Coffee,50,42.00",
        "NEW-1,New Bean,Coffee,10,25.00",
        "BAD-1,Bad Item,Coffee,-5,10.00",
      ].join("\n");

      const input: ImportFileInput = {
        storeId: "mont-kiara",
        mapping: defaultMapping,
        fileText: csv,
        fileName: "test.csv",
      };

      const result = validateImport(repo, input);
      expect(result.summary).toEqual({
        total: 3,
        valid: 2,
        invalid: 1,
        willCreate: 1,
        willUpdate: 1,
      });
      expect(result.rows).toHaveLength(3);
      expect(result.rows[0].status).toBe("valid");
      expect(result.rows[0].action).toBe("update");
      expect(result.rows[1].status).toBe("valid");
      expect(result.rows[1].action).toBe("create");
      expect(result.rows[2].status).toBe("invalid");
    });

    it("validates summary numbers on the generated sample file", () => {
      const sampleCsv = fs.readFileSync(
        path.resolve(process.cwd(), "samples/import-sample.csv"),
        "utf-8",
      );
      const parsed = parseCsv(sampleCsv);
      const mapping = autoMatchColumns(parsed.headers) as ImportMapping;

      const input: ImportFileInput = {
        storeId: "mont-kiara",
        mapping,
        fileText: sampleCsv,
        fileName: "import-sample.csv",
      };

      const result = validateImport(repo, input);
      expect(result.summary).toEqual({
        total: 63,
        valid: 55,
        invalid: 8,
        willCreate: 15,
        willUpdate: 40,
      });
    });
  });
});
