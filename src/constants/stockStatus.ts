export const STOCK_STATUS = {
  IN_STOCK: "in_stock",
  LOW: "low",
  OUT: "out",
} as const;

export const STOCK_STATUS_LABEL = {
  [STOCK_STATUS.IN_STOCK]: "In stock",
  [STOCK_STATUS.LOW]: "Low",
  [STOCK_STATUS.OUT]: "Out of stock",
} as const;

export const STOCK_STATUS_ORDER = {
  [STOCK_STATUS.OUT]: 0,
  [STOCK_STATUS.LOW]: 1,
  [STOCK_STATUS.IN_STOCK]: 2,
} as const;
