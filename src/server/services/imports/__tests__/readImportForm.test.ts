import { beforeEach, describe, expect, it } from "vitest";
import {
  ERROR_CODE,
  HTTP_STATUS,
  IMPORT_FIELD,
  IMPORT_LIMITS,
} from "@/constants";
import { createRepository } from "@/server/repositories";
import type { ImportMapping } from "@/types";
import { readImportForm } from "../readImportForm";

function createMultipartRequest(url: string, form: FormData): Request {
  const req = new Request(url);
  req.formData = async () => form;
  return req;
}

describe("readImportForm", () => {
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

  it("rejects files over 5 MB with 413 FILE_TOO_LARGE", async () => {
    const form = new FormData();
    const bigBuffer = new Uint8Array(IMPORT_LIMITS.maxFileBytes + 10);
    const bigFile = new File([bigBuffer], "big.csv", { type: "text/csv" });
    form.append("file", bigFile);
    form.append("storeId", "mont-kiara");
    form.append("mapping", JSON.stringify(defaultMapping));

    const request = createMultipartRequest(
      "http://localhost/api/imports/validate",
      form,
    );

    await expect(readImportForm(request, repo)).rejects.toMatchObject({
      code: ERROR_CODE.FILE_TOO_LARGE,
      status: HTTP_STATUS.PAYLOAD_TOO_LARGE,
    });
  });

  it("rejects empty or unreadable file with 422 INVALID_FILE", async () => {
    const form = new FormData();
    form.append("file", new File([""], "empty.csv", { type: "text/csv" }));
    form.append("storeId", "mont-kiara");
    form.append("mapping", JSON.stringify(defaultMapping));

    const request = createMultipartRequest(
      "http://localhost/api/imports/validate",
      form,
    );

    await expect(readImportForm(request, repo)).rejects.toMatchObject({
      code: ERROR_CODE.INVALID_FILE,
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
    });
  });

  it("rejects file with more than 2000 data rows with 422 IMPORT_TOO_LARGE", async () => {
    const form = new FormData();
    const rows = ["SKU,Name,Category,Quantity,Unit cost"];
    for (let i = 0; i < IMPORT_LIMITS.maxRows + 1; i++) {
      rows.push(`SKU-${i},Item ${i},Coffee,1,10.00`);
    }
    const file = new File([rows.join("\n")], "huge.csv", { type: "text/csv" });
    form.append("file", file);
    form.append("storeId", "mont-kiara");
    form.append("mapping", JSON.stringify(defaultMapping));

    const request = createMultipartRequest(
      "http://localhost/api/imports/validate",
      form,
    );

    await expect(readImportForm(request, repo)).rejects.toMatchObject({
      code: ERROR_CODE.IMPORT_TOO_LARGE,
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
    });
  });

  it("rejects unknown storeId with 404 STORE_NOT_FOUND", async () => {
    const form = new FormData();
    const file = new File(
      ["SKU,Name,Category,Quantity,Unit cost\nA,B,Coffee,1,10.00"],
      "test.csv",
      { type: "text/csv" },
    );
    form.append("file", file);
    form.append("storeId", "non-existent-store");
    form.append("mapping", JSON.stringify(defaultMapping));

    const request = createMultipartRequest(
      "http://localhost/api/imports/validate",
      form,
    );

    await expect(readImportForm(request, repo)).rejects.toMatchObject({
      code: ERROR_CODE.STORE_NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    });
  });

  it("rejects bad mapping with 422 VALIDATION_ERROR", async () => {
    const form = new FormData();
    const file = new File(
      ["SKU,Name,Category,Quantity,Unit cost\nA,B,Coffee,1,10.00"],
      "test.csv",
      { type: "text/csv" },
    );
    form.append("file", file);
    form.append("storeId", "mont-kiara");
    // Missing quantity mapping
    form.append("mapping", JSON.stringify({ SKU: "SKU", Name: "Name" }));

    const request = createMultipartRequest(
      "http://localhost/api/imports/validate",
      form,
    );

    await expect(readImportForm(request, repo)).rejects.toMatchObject({
      code: ERROR_CODE.VALIDATION_ERROR,
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
    });
  });
});
