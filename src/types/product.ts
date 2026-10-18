import type { z } from "zod";
import type { PRODUCT_SORT_KEY, STOCK_STATUS } from "@/constants";
import type {
  productDetailQuerySchema,
  productListQuerySchema,
  stockHistoryQuerySchema,
} from "@/schemas";
import type { Paginated } from "./common";
import type { StoreId } from "./store";

export type StockStatus = (typeof STOCK_STATUS)[keyof typeof STOCK_STATUS];

export type ProductSortKey = (typeof PRODUCT_SORT_KEY)[keyof typeof PRODUCT_SORT_KEY];

export type ProductListQuery = z.infer<typeof productListQuerySchema>;
export type ProductDetailQuery = z.infer<typeof productDetailQuerySchema>;
export type StockHistoryQuery = z.infer<typeof stockHistoryQuerySchema>;

export type ProductListItem = {
  id: string;
  sku: string;
  name: string;
  category: string;
  supplier: string;
  unitCostSen: number;
  onHand: number;
  reorderLevel: number;
  status: StockStatus;
  updatedAt: string;
};

export type ProductListSummary = {
  totalProducts: number;
  stockValueSen: number;
  lowStock: number;
  outOfStock: number;
};

export type ProductListResponse = Paginated<ProductListItem> & {
  summary: ProductListSummary;
};

export type StockByStore = {
  storeId: StoreId;
  onHand: number;
  reorderLevel: number;
  status: StockStatus;
  lastMovementAt: string | null;
};

export type ProductDetail = {
  id?: string;
  sku: string;
  name: string;
  category: string;
  supplier: string;
  unitCostSen: number;
  onHand?: number;
  reorderLevel?: number;
  status?: StockStatus;
  stockValueSen: number;
  lastMovementAt: string | null;
  stockByStore: StockByStore[];
};

export type StockHistoryPoint = {
  date: string;
  onHand: number;
  reorderLevel?: number;
};

export type StockHistory = {
  points: StockHistoryPoint[];
  reorderLevel: number;
};

export type StockHistoryResult = {
  points: StockHistoryPoint[];
  days: number;
};

// Repository internal types
export type ProductRecord = {
  sku: string;
  name: string;
  category: string;
  supplier: string;
  unitCostSen: number;
};

export type StockRecord = {
  storeId: string;
  onHand: number;
  reorderLevel: number;
};
