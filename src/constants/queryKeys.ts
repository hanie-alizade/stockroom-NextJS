export const queryKeys = {
  meta: {
    all: ["meta"] as const,
  },
  products: {
    all: ["products"] as const,
    list: (params?: unknown) => ["products", "list", params] as const,
  },
} as const;

export const QUERY_KEYS = queryKeys;
