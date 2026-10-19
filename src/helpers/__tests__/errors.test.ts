import { describe, expect, it } from "vitest";
import { ApiError } from "@/api/axiosConfig";
import { ERROR_CODE, ERROR_MESSAGE } from "@/constants";
import { fieldErrorsToRecord, getErrorInfo } from "../errors";

describe("getErrorInfo", () => {
  it("recognizes network errors and marks them retryable", () => {
    const error = new ApiError(
      {
        error: "INTERNAL_ERROR",
        message: "Network error",
        fieldErrors: [],
      },
      0,
      "NETWORK_ERROR",
    );

    const info = getErrorInfo(error);

    expect(info.kind).toBe("network");
    expect(info.retryable).toBe(true);
    expect(info.status).toBe(0);
    expect(info.code).toBe("NETWORK_ERROR");
    expect(info.title).toBe(ERROR_MESSAGE.NETWORK.title);
    expect(info.message).toBe(ERROR_MESSAGE.NETWORK.message);
  });

  it("recognizes 403 forbidden ApiError and marks it non-retryable", () => {
    const error = new ApiError(
      {
        error: ERROR_CODE.FORBIDDEN,
        message: "You do not have permission",
        fieldErrors: [],
      },
      403,
      ERROR_CODE.FORBIDDEN,
    );

    const info = getErrorInfo(error);

    expect(info.kind).toBe("forbidden");
    expect(info.retryable).toBe(false);
    expect(info.status).toBe(403);
    expect(info.code).toBe(ERROR_CODE.FORBIDDEN);
    expect(info.title).toBe(ERROR_MESSAGE.FORBIDDEN.title);
    expect(info.message).toBe("You do not have permission");
  });

  it("recognizes 404 notFound ApiError", () => {
    const error = new ApiError(
      {
        error: ERROR_CODE.PRODUCT_NOT_FOUND,
        message: "Product not found",
        fieldErrors: [],
      },
      404,
      ERROR_CODE.PRODUCT_NOT_FOUND,
    );

    const info = getErrorInfo(error);

    expect(info.kind).toBe("notFound");
    expect(info.retryable).toBe(false);
    expect(info.status).toBe(404);
    expect(info.code).toBe(ERROR_CODE.PRODUCT_NOT_FOUND);
    expect(info.title).toBe(ERROR_MESSAGE.PRODUCT_NOT_FOUND.title);
  });

  it("recognizes 422 validation ApiError with fieldErrors", () => {
    const fieldErrors = [{ field: "quantity", code: "TOO_MANY", message: "Only 18 on hand" }];
    const error = new ApiError(
      {
        error: ERROR_CODE.VALIDATION_ERROR,
        message: "Validation failed",
        fieldErrors,
      },
      422,
      ERROR_CODE.VALIDATION_ERROR,
    );

    const info = getErrorInfo(error);

    expect(info.kind).toBe("validation");
    expect(info.retryable).toBe(false);
    expect(info.status).toBe(422);
    expect(info.fieldErrors).toEqual(fieldErrors);
    expect(info.title).toBe(ERROR_MESSAGE.VALIDATION_ERROR.title);
  });

  it("recognizes 500 server error and marks it retryable", () => {
    const error = new ApiError(
      {
        error: ERROR_CODE.INTERNAL_ERROR,
        message: "Internal server error",
        fieldErrors: [],
      },
      500,
      ERROR_CODE.INTERNAL_ERROR,
    );

    const info = getErrorInfo(error);

    expect(info.kind).toBe("server");
    expect(info.retryable).toBe(true);
    expect(info.status).toBe(500);
    expect(info.title).toBe(ERROR_MESSAGE.INTERNAL_ERROR.title);
  });

  it("handles plain Error objects", () => {
    const error = new Error("Something broke");

    const info = getErrorInfo(error);

    expect(info.kind).toBe("unknown");
    expect(info.retryable).toBe(true);
    expect(info.message).toBe("Something broke");
    expect(info.title).toBe(ERROR_MESSAGE.UNKNOWN.title);
  });

  it("handles unknown non-error values", () => {
    const info = getErrorInfo("Unknown error string");

    expect(info.kind).toBe("unknown");
    expect(info.retryable).toBe(true);
    expect(info.message).toBe("Unknown error string");
  });
});

describe("fieldErrorsToRecord", () => {
  it("converts an array of field errors into a record mapping", () => {
    const fieldErrors = [
      { field: "quantity", code: "REQUIRED", message: "Quantity is required" },
      { field: "reason", code: "TOO_SHORT", message: "Enter a reason" },
    ];

    const record = fieldErrorsToRecord(fieldErrors);

    expect(record).toEqual({
      quantity: "Quantity is required",
      reason: "Enter a reason",
    });
  });

  it("keeps the first message if a field appears more than once", () => {
    const fieldErrors = [
      { field: "quantity", code: "REQUIRED", message: "First message" },
      { field: "quantity", code: "TOO_MANY", message: "Second message" },
    ];

    const record = fieldErrorsToRecord(fieldErrors);

    expect(record.quantity).toBe("First message");
  });

  it("returns an empty record when passed undefined or an empty array", () => {
    expect(fieldErrorsToRecord()).toEqual({});
    expect(fieldErrorsToRecord([])).toEqual({});
  });
});
