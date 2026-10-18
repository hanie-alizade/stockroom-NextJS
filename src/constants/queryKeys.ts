export const queryKeys = {
  meta: {
    all: ["meta"] as const,
  },
  products: {
    all: ["products"] as const,
    list: (params?: unknown) => ["products", "list", params] as const,
    detail: (id: string, params?: unknown) => ["products", "detail", id, params] as const,
    movements: (id: string, params?: unknown) => ["products", "movements", id, params] as const,
    stockHistory: (id: string, params?: unknown) =>
      ["products", "stock-history", id, params] as const,
  },
} as const;

export const QUERY_KEYS = queryKeys;
