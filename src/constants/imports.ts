export const IMPORT_FIELD = {
  SKU: "sku",
  NAME: "name",
  CATEGORY: "category",
  QUANTITY: "quantity",
  UNIT_COST: "unitCost",
} as const;

export const IMPORT_REQUIRED_FIELDS = [
  IMPORT_FIELD.SKU,
  IMPORT_FIELD.NAME,
  IMPORT_FIELD.CATEGORY,
  IMPORT_FIELD.QUANTITY,
  IMPORT_FIELD.UNIT_COST,
] as const;

export const IMPORT_FIELD_LABEL = {
  [IMPORT_FIELD.SKU]: "SKU",
  [IMPORT_FIELD.NAME]: "Name",
  [IMPORT_FIELD.CATEGORY]: "Category",
  [IMPORT_FIELD.QUANTITY]: "Quantity",
  [IMPORT_FIELD.UNIT_COST]: "Unit cost",
} as const;

export const IMPORT_FIELD_ALIASES = {
  [IMPORT_FIELD.SKU]: ["sku", "item code", "code", "item sku"],
  [IMPORT_FIELD.NAME]: ["name", "description", "product", "product name", "item name"],
  [IMPORT_FIELD.CATEGORY]: ["category", "group", "type"],
  [IMPORT_FIELD.QUANTITY]: ["quantity", "qty", "on hand", "stock"],
  [IMPORT_FIELD.UNIT_COST]: ["unit cost", "cost", "cost (rm)", "price"],
} as const;

export const IMPORT_ERROR_CODE = {
  MISSING_REQUIRED: "MISSING_REQUIRED",
  INVALID_QUANTITY: "INVALID_QUANTITY",
  INVALID_UNIT_COST: "INVALID_UNIT_COST",
  INVALID_SKU: "INVALID_SKU",
  UNKNOWN_CATEGORY: "UNKNOWN_CATEGORY",
  DUPLICATE_SKU_IN_FILE: "DUPLICATE_SKU_IN_FILE",
  NAME_TOO_LONG: "NAME_TOO_LONG",
} as const;

export const IMPORT_ROW_STATUS = {
  VALID: "valid",
  INVALID: "invalid",
} as const;

export const IMPORT_ACTION = {
  CREATE: "create",
  UPDATE: "update",
} as const;

export const IMPORT_LIMITS = {
  maxFileBytes: 5 * 1024 * 1024,
  maxRows: 2000,
  maxSkuLength: 32,
  maxNameLength: 120,
} as const;

export const IMPORT_ROW_MESSAGE = {
  QUANTITY_NEGATIVE: "Quantity can't be negative",
  QUANTITY_NOT_WHOLE: "Quantity must be a whole number",
  UNIT_COST_NOT_A_NUMBER: "Unit cost isn't a number",
  UNIT_COST_MISSING: "Unit cost is missing",
  SKU_MISSING: "SKU is missing",
  SAME_SKU: (row: number): string => `Same SKU as row ${row}`,
  UNKNOWN_CATEGORY: (category: string): string => `Category "${category}" doesn't exist`,
  NAME_MISSING: "Name is missing",
  QUANTITY_MISSING: "Quantity is missing",
  CATEGORY_MISSING: "Category is missing",
  NAME_TOO_LONG: "Name is too long",
  UNIT_COST_NEGATIVE: "Unit cost can't be negative",
  UNIT_COST_DECIMALS: "Unit cost can have at most 2 decimals",
  SKU_INVALID_CHARS: "SKU can only use letters, numbers, dots and dashes",
} as const;
