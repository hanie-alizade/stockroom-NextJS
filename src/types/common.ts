import type { z } from "zod";
import type { ERROR_CODE, PAGE_SIZE_OPTIONS, SORT_DIRECTION } from "@/constants";
import type { paginationQuerySchema } from "@/schemas";

export type ErrorCode = (typeof ERROR_CODE)[keyof typeof ERROR_CODE];

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

export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export type SortDirection = (typeof SORT_DIRECTION)[keyof typeof SORT_DIRECTION];

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
