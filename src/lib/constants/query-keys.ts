import type { ProductListQuery } from "@/lib/types/product";

export const queryKeys = {
  meta: {
    all: ["meta"] as const,
  },
  products: {
    all: ["products"] as const,
    list: (params?: ProductListQuery) => ["products", "list", params] as const,
  },
};
