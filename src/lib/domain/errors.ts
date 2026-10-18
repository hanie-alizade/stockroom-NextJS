import type { ErrorCode, FieldError } from "@/types";



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
