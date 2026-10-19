import { ApiError } from "@/api/axiosConfig";
import { ERROR_CODE, ERROR_MESSAGE, type ErrorMessageKey } from "@/constants";
import type { FieldError } from "@/types";

export type ErrorKind =
  | "network"
  | "forbidden"
  | "notFound"
  | "validation"
  | "server"
  | "unknown";

export interface ErrorInfo {
  kind: ErrorKind;
  status?: number;
  code?: string;
  title: string;
  message: string;
  fieldErrors: FieldError[];
  retryable: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function getErrorInfo(error: unknown): ErrorInfo {
  let status: number | undefined;
  let code: string | undefined;
  let rawMessage: string | undefined;
  let fieldErrors: FieldError[] = [];

  if (error instanceof ApiError) {
    status = error.status;
    code = error.code ?? error.body?.error;
    rawMessage = error.body?.message || error.message;
    fieldErrors = error.body?.fieldErrors ?? [];
  } else if (isRecord(error) && error.name === "ApiError" && isRecord(error.body)) {
    const body = error.body as { error?: string; message?: string; fieldErrors?: FieldError[] };
    status = typeof error.status === "number" ? error.status : undefined;
    code = typeof error.code === "string" ? error.code : body.error;
    rawMessage = body.message || (typeof error.message === "string" ? error.message : undefined);
    fieldErrors = Array.isArray(body.fieldErrors) ? body.fieldErrors : [];
  } else if (isRecord(error) && error.name === "AppError") {
    status = typeof error.status === "number" ? error.status : undefined;
    code = typeof error.code === "string" ? error.code : undefined;
    rawMessage = typeof error.message === "string" ? error.message : undefined;
    fieldErrors = Array.isArray(error.fieldErrors) ? (error.fieldErrors as FieldError[]) : [];
  } else if (error instanceof Error) {
    rawMessage = error.message;
    if ("status" in error && typeof error.status === "number") {
      status = error.status;
    }
    if ("code" in error && typeof error.code === "string") {
      code = error.code;
    }
  } else if (typeof error === "string") {
    rawMessage = error;
  } else if (isRecord(error)) {
    if (typeof error.message === "string") rawMessage = error.message;
    if (typeof error.status === "number") status = error.status;
    if (typeof error.code === "string") code = error.code;
  }

  // Determine kind
  let kind: ErrorKind = "unknown";
  if (
    status === 0 ||
    code === "NETWORK_ERROR" ||
    code === "ERR_NETWORK" ||
    rawMessage === "Network error" ||
    rawMessage === "Network Error"
  ) {
    kind = "network";
  } else if (status === 403 || code === ERROR_CODE.FORBIDDEN) {
    kind = "forbidden";
  } else if (
    status === 404 ||
    code === ERROR_CODE.PRODUCT_NOT_FOUND ||
    code === ERROR_CODE.STORE_NOT_FOUND
  ) {
    kind = "notFound";
  } else if (status === 413 || code === ERROR_CODE.FILE_TOO_LARGE) {
    kind = "validation";
    code = ERROR_CODE.FILE_TOO_LARGE;
  } else if (
    status === 422 ||
    status === 400 ||
    code === ERROR_CODE.VALIDATION_ERROR ||
    fieldErrors.length > 0
  ) {
    kind = "validation";
  } else if ((status !== undefined && status >= 500) || code === ERROR_CODE.INTERNAL_ERROR) {
    kind = "server";
  }

  // Determine retryable: 4xx is never retryable; 5xx and network errors are retryable
  let retryable = false;
  if (kind === "network" || kind === "server") {
    retryable = true;
  } else if (kind === "unknown") {
    if (status !== undefined) {
      retryable = status >= 500 || status < 400;
    } else {
      retryable = true;
    }
  }

  // Title and message resolution
  let title: string;
  let message: string;

  if (code && code in ERROR_MESSAGE) {
    const defaultTemplate = ERROR_MESSAGE[code as ErrorMessageKey];
    title = defaultTemplate.title;
    message = rawMessage && rawMessage !== "Network error" ? rawMessage : defaultTemplate.message;
  } else {
    switch (kind) {
      case "network":
        title = ERROR_MESSAGE.NETWORK.title;
        message =
          rawMessage && rawMessage !== "Network error" && rawMessage !== "Network Error"
            ? rawMessage
            : ERROR_MESSAGE.NETWORK.message;
        break;
      case "forbidden":
        title = ERROR_MESSAGE.FORBIDDEN.title;
        message = rawMessage || ERROR_MESSAGE.FORBIDDEN.message;
        break;
      case "notFound":
        title = ERROR_MESSAGE.PRODUCT_NOT_FOUND.title;
        message = rawMessage || ERROR_MESSAGE.PRODUCT_NOT_FOUND.message;
        break;
      case "validation":
        title = ERROR_MESSAGE.VALIDATION_ERROR.title;
        message = rawMessage || ERROR_MESSAGE.VALIDATION_ERROR.message;
        break;
      case "server":
        title = ERROR_MESSAGE.INTERNAL_ERROR.title;
        message = rawMessage || ERROR_MESSAGE.INTERNAL_ERROR.message;
        break;
      case "unknown":
      default:
        title = ERROR_MESSAGE.UNKNOWN.title;
        message = rawMessage || ERROR_MESSAGE.UNKNOWN.message;
        break;
    }
  }

  return {
    kind,
    status,
    code,
    title,
    message,
    fieldErrors,
    retryable,
  };
}

export function fieldErrorsToRecord(fieldErrors: FieldError[] = []): Record<string, string> {
  if (!Array.isArray(fieldErrors)) {
    return {};
  }
  const result: Record<string, string> = {};
  for (const item of fieldErrors) {
    if (item.field && !result[item.field]) {
      result[item.field] = item.message;
    }
  }
  return result;
}
