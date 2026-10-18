export const SORT_DIRECTION = {
  ASC: "asc",
  DESC: "desc",
} as const;

export const PRODUCT_SORT_KEY = {
  UPDATED_AT: "updatedAt",
  SKU: "sku",
  NAME: "name",
  CATEGORY: "category",
  ON_HAND: "onHand",
  REORDER_LEVEL: "reorderLevel",
  UNIT_COST_SEN: "unitCostSen",
  STATUS: "status",
} as const;

export const DEFAULT_SORT_DIRECTION = SORT_DIRECTION.DESC;
export const DEFAULT_PRODUCT_SORT_KEY = PRODUCT_SORT_KEY.UPDATED_AT;
export const DEFAULT_SORT = DEFAULT_PRODUCT_SORT_KEY;
export const DEFAULT_DIR = DEFAULT_SORT_DIRECTION;
