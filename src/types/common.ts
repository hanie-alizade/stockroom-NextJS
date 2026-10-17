import type { ReactElement, SVGProps } from "react";

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

export type ApiErrorBody = {
  error: ErrorCode;
  message: string;
  fieldErrors: FieldError[];
};

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export type PageSize = 25 | 50 | 100;

export type SortDirection = "asc" | "desc";

export type IconProps = SVGProps<SVGSVGElement>;
export type IconComponent = (props: IconProps) => ReactElement;
