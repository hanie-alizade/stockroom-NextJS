import type {
  IMPORT_ACTION,
  IMPORT_ERROR_CODE,
  IMPORT_FIELD,
  IMPORT_ROW_STATUS,
} from "@/constants";

export type ImportField = (typeof IMPORT_FIELD)[keyof typeof IMPORT_FIELD];

export type ImportErrorCode = (typeof IMPORT_ERROR_CODE)[keyof typeof IMPORT_ERROR_CODE];

export type ImportRowStatus = (typeof IMPORT_ROW_STATUS)[keyof typeof IMPORT_ROW_STATUS];

export type ImportAction = (typeof IMPORT_ACTION)[keyof typeof IMPORT_ACTION];

export type ImportMapping = Partial<Record<ImportField, string>>;

export type ImportRowValues = Record<ImportField, string>;

export type ImportRowError = {
  code: ImportErrorCode;
  field: ImportField;
  message: string;
};

export type ImportRowResult = {
  rowNumber: number;
  status: ImportRowStatus;
  action?: ImportAction;
  values: ImportRowValues;
  data?: {
    sku: string;
    name: string;
    category: string;
    quantity: number;
    unitCostSen: number;
  };
  errors: ImportRowError[];
};

export type ImportValidationSummary = {
  total: number;
  valid: number;
  invalid: number;
  willCreate: number;
  willUpdate: number;
};

export type ImportValidationResult = {
  summary: ImportValidationSummary;
  rows: ImportRowResult[];
};

export type ImportCommitResult = {
  created: number;
  updated: number;
  unchanged: number;
  skipped: number;
  skippedRows: {
    rowNumber: number;
    errors: ImportRowError[];
  }[];
};

export type ImportRowContext = {
  rowNumber: number;
  categories: readonly string[];
  existingSkus: ReadonlySet<string>;
  duplicateOfRow?: number;
};
