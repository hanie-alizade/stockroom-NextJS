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
      message: "CSV file is empty",
      fieldErrors: [{ field: "file", message: "CSV file is empty" }],
    });
  });

  it("rejects header-only file (0 data rows) with 422 INVALID_FILE", async () => {
    const form = new FormData();
    form.append(
      "file",
      new File(["SKU,Name,Category,Quantity,Unit cost"], "header-only.csv", {
        type: "text/csv",
      }),
    );
    form.append("storeId", "mont-kiara");
    form.append("mapping", JSON.stringify(defaultMapping));

    const request = createMultipartRequest(
      "http://localhost/api/imports/validate",
      form,
    );

    await expect(readImportForm(request, repo)).rejects.toMatchObject({
      code: ERROR_CODE.INVALID_FILE,
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      message: "This file has no data rows.",
      fieldErrors: [{ field: "file", message: "This file has no data rows." }],
    });
  });

  it("rejects non-CSV file type with 422 INVALID_FILE", async () => {
    const form = new FormData();
    form.append(
      "file",
      new File(["some binary data"], "image.png", {
        type: "image/png",
      }),
    );
    form.append("storeId", "mont-kiara");
    form.append("mapping", JSON.stringify(defaultMapping));

    const request = createMultipartRequest(
      "http://localhost/api/imports/validate",
      form,
    );

    await expect(readImportForm(request, repo)).rejects.toMatchObject({
      code: ERROR_CODE.INVALID_FILE,
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      message: "Only CSV files are supported.",
      fieldErrors: [{ field: "file", message: "Only CSV files are supported." }],
    });
  });

  it("successfully reads and parses real sample CSV (50+ rows)", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const sampleCsvContent = fs.readFileSync(
      path.resolve(process.cwd(), "samples/import-sample.csv"),
      "utf-8",
    );
    const sampleMapping: ImportMapping = {
      [IMPORT_FIELD.SKU]: "Item code",
      [IMPORT_FIELD.NAME]: "Description",
      [IMPORT_FIELD.CATEGORY]: "Group",
      [IMPORT_FIELD.QUANTITY]: "Qty",
      [IMPORT_FIELD.UNIT_COST]: "Cost (RM)",
    };

    const form = new FormData();
    form.append(
      "file",
      new File([sampleCsvContent], "import-sample.csv", {
        type: "text/csv",
      }),
    );
    form.append("storeId", "mont-kiara");
    form.append("mapping", JSON.stringify(sampleMapping));

    const request = createMultipartRequest(
      "http://localhost/api/imports/validate",
      form,
    );

    const result = await readImportForm(request, repo);
    expect(result.storeId).toBe("mont-kiara");
    expect(result.fileName).toBe("import-sample.csv");
    expect(result.fileText).toContain("KL-1042");
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
