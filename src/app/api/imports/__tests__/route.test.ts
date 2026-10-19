import { describe, it, expect, beforeEach, vi } from "vitest";
import { cookies } from "next/headers";

import { createRepository } from "@/server/repositories";
import { mockCookies } from "tests/helpers";
import { POST as validateRoute } from "../validate/route";
import { POST as commitRoute } from "../commit/route";
import {
  ERROR_CODE,
  HTTP_STATUS,
  IDEMPOTENCY_KEY_HEADER,
  IMPORT_FIELD,
} from "@/constants";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

const managerCookies = mockCookies("aina-rahman");
const staffCookies = mockCookies("faiz-hakim");

const repo = createRepository();

function createMultipartRequest(
  urlStr: string,
  fields: {
    storeId?: string;
    mapping?: string;
    file?: File;
  },
  headers?: Record<string, string>,
): Request {
  const form = new FormData();
  if (fields.storeId !== undefined) {
    form.append("storeId", fields.storeId);
  }
  if (fields.mapping !== undefined) {
    form.append("mapping", fields.mapping);
  }
  if (fields.file !== undefined) {
    form.append("file", fields.file);
  }

  const reqHeaders = new Headers(headers);
  const request = new Request(urlStr, {
    method: "POST",
    headers: reqHeaders,
  });

  request.formData = async () => form;
  return request;
}

const defaultMappingJson = JSON.stringify({
  [IMPORT_FIELD.SKU]: "SKU",
  [IMPORT_FIELD.NAME]: "Name",
  [IMPORT_FIELD.CATEGORY]: "Category",
  [IMPORT_FIELD.QUANTITY]: "Quantity",
  [IMPORT_FIELD.UNIT_COST]: "Unit cost",
});

const validCsv = [
  "SKU,Name,Category,Quantity,Unit cost",
  "NEW-TEST-1,Test Item,Coffee,10,12.50",
].join("\n");

describe("Imports API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.reset();
  });

  describe("POST /api/imports/validate", () => {
    it("returns 403 FORBIDDEN when staff accesses validate", async () => {
      vi.mocked(cookies).mockResolvedValue(staffCookies);

      const request = createMultipartRequest("http://localhost/api/imports/validate", {
        storeId: "mont-kiara",
        mapping: defaultMappingJson,
        file: new File([validCsv], "test.csv", { type: "text/csv" }),
      });

      const response = await validateRoute(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(data.error).toBe(ERROR_CODE.FORBIDDEN);
    });

    it("returns 200 OK with validation result for manager", async () => {
      vi.mocked(cookies).mockResolvedValue(managerCookies);

      const request = createMultipartRequest("http://localhost/api/imports/validate", {
        storeId: "mont-kiara",
        mapping: defaultMappingJson,
        file: new File([validCsv], "test.csv", { type: "text/csv" }),
      });

      const response = await validateRoute(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.summary.total).toBe(1);
      expect(data.summary.valid).toBe(1);
      expect(data.rows).toHaveLength(1);
    });

    it("returns 413 FILE_TOO_LARGE when file exceeds 5MB", async () => {
      vi.mocked(cookies).mockResolvedValue(managerCookies);

      const largeContent = "a".repeat(5 * 1024 * 1024 + 1);
      const request = createMultipartRequest("http://localhost/api/imports/validate", {
        storeId: "mont-kiara",
        mapping: defaultMappingJson,
        file: new File([largeContent], "large.csv", { type: "text/csv" }),
      });

      const response = await validateRoute(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.PAYLOAD_TOO_LARGE);
      expect(data.error).toBe(ERROR_CODE.FILE_TOO_LARGE);
    });

    it("returns 422 INVALID_FILE when file is empty", async () => {
      vi.mocked(cookies).mockResolvedValue(managerCookies);

      const request = createMultipartRequest("http://localhost/api/imports/validate", {
        storeId: "mont-kiara",
        mapping: defaultMappingJson,
        file: new File([""], "empty.csv", { type: "text/csv" }),
      });

      const response = await validateRoute(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
      expect(data.error).toBe(ERROR_CODE.INVALID_FILE);
    });

    it("returns 500 when ?fail=1 is passed", async () => {
      vi.mocked(cookies).mockResolvedValue(managerCookies);

      const request = createMultipartRequest(
        "http://localhost/api/imports/validate?fail=1",
        {
          storeId: "mont-kiara",
          mapping: defaultMappingJson,
          file: new File([validCsv], "test.csv", { type: "text/csv" }),
        },
      );

      const response = await validateRoute(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error).toBe(ERROR_CODE.INTERNAL_ERROR);
    });
  });

  describe("POST /api/imports/commit", () => {
    it("returns 403 FORBIDDEN when staff accesses commit", async () => {
      vi.mocked(cookies).mockResolvedValue(staffCookies);

      const request = createMultipartRequest(
        "http://localhost/api/imports/commit",
        {
          storeId: "mont-kiara",
          mapping: defaultMappingJson,
          file: new File([validCsv], "test.csv", { type: "text/csv" }),
        },
        { [IDEMPOTENCY_KEY_HEADER]: "route-commit-staff-1" },
      );

      const response = await commitRoute(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(data.error).toBe(ERROR_CODE.FORBIDDEN);
    });

    it("returns 400 when Idempotency-Key header is missing", async () => {
      vi.mocked(cookies).mockResolvedValue(managerCookies);

      const request = createMultipartRequest("http://localhost/api/imports/commit", {
        storeId: "mont-kiara",
        mapping: defaultMappingJson,
        file: new File([validCsv], "test.csv", { type: "text/csv" }),
      });

      const response = await commitRoute(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error).toBe(ERROR_CODE.IDEMPOTENCY_KEY_REQUIRED);
    });

    it("returns 200 OK with commit result for manager with valid idempotency key", async () => {
      vi.mocked(cookies).mockResolvedValue(managerCookies);

      const request = createMultipartRequest(
        "http://localhost/api/imports/commit",
        {
          storeId: "mont-kiara",
          mapping: defaultMappingJson,
          file: new File([validCsv], "test.csv", { type: "text/csv" }),
        },
        { [IDEMPOTENCY_KEY_HEADER]: "route-commit-manager-1" },
      );

      const response = await commitRoute(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.created).toBe(1);
      expect(data.updated).toBe(0);
      expect(data.skipped).toBe(0);
    });

    it("returns 500 when ?fail=1 is passed on commit", async () => {
      vi.mocked(cookies).mockResolvedValue(managerCookies);

      const request = createMultipartRequest(
        "http://localhost/api/imports/commit?fail=1",
        {
          storeId: "mont-kiara",
          mapping: defaultMappingJson,
          file: new File([validCsv], "test.csv", { type: "text/csv" }),
        },
        { [IDEMPOTENCY_KEY_HEADER]: "route-commit-fail-1" },
      );

      const response = await commitRoute(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error).toBe(ERROR_CODE.INTERNAL_ERROR);
    });
  });
});
