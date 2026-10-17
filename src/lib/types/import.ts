export type ImportField = "sku" | "name" | "category" | "quantity" | "unitCost";

export type ImportErrorCode =
  | "MISSING_REQUIRED"
  | "INVALID_QUANTITY"
  | "INVALID_UNIT_COST"
  | "INVALID_SKU"
  | "UNKNOWN_CATEGORY"
  | "DUPLICATE_SKU_IN_FILE"
  | "NAME_TOO_LONG";

export type ImportContext = {
  rowNumber: number;
  mapping: Partial<Record<ImportField, string>>;
  categories: readonly string[];
  existingSkus: ReadonlySet<string>;
  duplicateOfRow?: number; // set when an earlier row had the same SKU: the number of that first row
};

export type ImportRowError = {
  code: ImportErrorCode;
  field: ImportField;
  message: string;
};

export type ImportRowResult = {
  rowNumber: number;
  status: "valid" | "invalid";
  action?: "create" | "update";
  data?: {
    sku: string;
    name: string;
    category: string;
    quantity: number;
    unitCostSen: number;
  };
  errors: ImportRowError[];
};
