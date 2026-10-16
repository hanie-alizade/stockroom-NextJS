export type ErrorCode =
  | "INVALID_JSON"
  | "IDEMPOTENCY_KEY_REQUIRED"
  | "FORBIDDEN"
  | "PRODUCT_NOT_FOUND"
  | "STORE_NOT_FOUND"
  | "NOT_STOCKED_AT_STORE"
  | "INSUFFICIENT_STOCK"
  | "VALIDATION_ERROR"
  | "IDEMPOTENCY_KEY_REUSED"
  | "IMPORT_TOO_LARGE"
  | "FILE_TOO_LARGE"
  | "INVALID_FILE"
  | "INTERNAL_ERROR";

export type FieldError = {
  field: string;
  code: string;
  message: string;
};

export class AppError extends Error {
  code: ErrorCode;
  status: number;
  fieldErrors?: FieldError[];

  constructor(code: ErrorCode, status: number, message: string, fieldErrors?: FieldError[]) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}
