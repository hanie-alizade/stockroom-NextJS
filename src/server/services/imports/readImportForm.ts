import "server-only";

import {
  ERROR_CODE,
  FIELD_ERROR_CODE,
  HTTP_STATUS,
  IMPORT_LIMITS,
} from "@/constants";
import { AppError } from "@/domain";
import { parseCsv } from "@/helpers";
import { importMappingSchema } from "@/schemas";
import type { Repository } from "@/server/repositories";
import type { ImportMapping } from "@/types";
import type { ImportFileInput } from "./types";

async function readFileText(file: Blob): Promise<string> {
  if (typeof file.text === "function") {
    return file.text();
  }
  if (typeof FileReader !== "undefined") {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) ?? "");
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }
  throw new Error("No file reader available");
}

/**
 * Reads and validates a multipart import form submission.
 * Checks file size, CSV header validity, row limits, store existence, and column mapping.
 */
export async function readImportForm(
  request: Request,
  repo: Repository,
): Promise<ImportFileInput> {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    throw new AppError(
      ERROR_CODE.INVALID_FILE,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      "Invalid multipart form data",
    );
  }

  const fileEntry = formData.get("file");
  if (!fileEntry || !(fileEntry instanceof Blob)) {
    throw new AppError(
      ERROR_CODE.INVALID_FILE,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      "Missing or invalid file",
    );
  }

  if (fileEntry.size > IMPORT_LIMITS.maxFileBytes) {
    throw new AppError(
      ERROR_CODE.FILE_TOO_LARGE,
      HTTP_STATUS.PAYLOAD_TOO_LARGE,
      "This file is over 5 MB.",
    );
  }

  const fileName = (fileEntry as File).name || "import.csv";
  let fileText: string;
  try {
    fileText = await readFileText(fileEntry);
  } catch {
    throw new AppError(
      ERROR_CODE.INVALID_FILE,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      "Unable to read file content",
    );
  }

  if (!fileText.trim()) {
    throw new AppError(
      ERROR_CODE.INVALID_FILE,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      "CSV file is empty",
    );
  }

  const parsedCsv = parseCsv(fileText);
  if (parsedCsv.headers.length === 0) {
    throw new AppError(
      ERROR_CODE.INVALID_FILE,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      "CSV file has no header row",
    );
  }

  if (parsedCsv.rowCount > IMPORT_LIMITS.maxRows) {
    throw new AppError(
      ERROR_CODE.IMPORT_TOO_LARGE,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      "File exceeds limit of 2,000 rows",
    );
  }

  const rawStoreId = formData.get("storeId");
  if (typeof rawStoreId !== "string" || !rawStoreId.trim()) {
    throw new AppError(
      ERROR_CODE.VALIDATION_ERROR,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      "Store is required",
      [
        {
          field: "storeId",
          code: FIELD_ERROR_CODE.REQUIRED,
          message: "Store is required",
        },
      ],
    );
  }

  const storeId = rawStoreId.trim();
  const stores = repo.getStores();
  if (!stores.some((s) => s.id === storeId)) {
    throw new AppError(
      ERROR_CODE.STORE_NOT_FOUND,
      HTTP_STATUS.NOT_FOUND,
      "Store not found",
    );
  }

  const rawMapping = formData.get("mapping");
  if (typeof rawMapping !== "string" || !rawMapping.trim()) {
    throw new AppError(
      ERROR_CODE.VALIDATION_ERROR,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      "Mapping is required",
      [
        {
          field: "mapping",
          code: FIELD_ERROR_CODE.REQUIRED,
          message: "Mapping is required",
        },
      ],
    );
  }

  const mappingParsed = importMappingSchema.safeParse(rawMapping);
  if (!mappingParsed.success) {
    const fieldErrors = mappingParsed.error.issues.map((issue) => ({
      field: "mapping",
      code: FIELD_ERROR_CODE.VALIDATION_ERROR,
      message: issue.message,
    }));
    throw new AppError(
      ERROR_CODE.VALIDATION_ERROR,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      "Invalid column mapping",
      fieldErrors,
    );
  }

  return {
    storeId,
    mapping: mappingParsed.data as ImportMapping,
    fileText,
    fileName,
  };
}
