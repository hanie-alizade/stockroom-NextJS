import { ERROR_CODE } from "./errorCodes";

export const ERROR_MESSAGE = {
  [ERROR_CODE.INVALID_JSON]: {
    title: "Invalid request",
    message: "The request payload could not be parsed.",
  },
  [ERROR_CODE.IDEMPOTENCY_KEY_REQUIRED]: {
    title: "Idempotency key required",
    message: "An idempotency key is required for this request.",
  },
  [ERROR_CODE.FORBIDDEN]: {
    title: "Access denied",
    message: "You do not have permission to perform this action.",
  },
  [ERROR_CODE.PRODUCT_NOT_FOUND]: {
    title: "Product not found",
    message: "The requested product could not be found.",
  },
  [ERROR_CODE.STORE_NOT_FOUND]: {
    title: "Store not found",
    message: "The requested store could not be found.",
  },
  [ERROR_CODE.NOT_STOCKED_AT_STORE]: {
    title: "Not stocked at store",
    message: "This product is not carried at the selected store.",
  },
  [ERROR_CODE.INSUFFICIENT_STOCK]: {
    title: "Insufficient stock",
    message: "There is not enough stock on hand for this change.",
  },
  [ERROR_CODE.VALIDATION_ERROR]: {
    title: "Validation error",
    message: "Please check the highlighted fields and try again.",
  },
  [ERROR_CODE.IDEMPOTENCY_KEY_REUSED]: {
    title: "Request already processed",
    message: "This request has already been processed.",
  },
  [ERROR_CODE.IMPORT_TOO_LARGE]: {
    title: "Import too large",
    message: "The file exceeds the maximum allowed rows (2,000).",
  },
  [ERROR_CODE.FILE_TOO_LARGE]: {
    title: "File too large",
    message: "This file is over 5 MB.",
  },
  [ERROR_CODE.INVALID_FILE]: {
    title: "Invalid file",
    message: "Only CSV files are supported.",
  },
  [ERROR_CODE.INTERNAL_ERROR]: {
    title: "Something went wrong",
    message: "The server returned an error. Your data hasn't changed.",
  },
  NETWORK: {
    title: "Connection issue",
    message: "Unable to reach the server. Please check your internet connection.",
  },
  UNKNOWN: {
    title: "Something went wrong",
    message: "An unexpected error occurred. Please try again.",
  },
} as const;

export type ErrorMessageKey = keyof typeof ERROR_MESSAGE;
