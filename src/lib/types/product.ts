import type { z } from "zod";
import type { productListQuerySchema } from "@/lib/domain/schemas";
import type { Movement } from "./movement";
import type { Paginated } from "./common";
import type { StoreId } from "./store";

export type StockStatus = "in_stock" | "low" | "out";

export type ProductSortKey =
  "updatedAt" | "sku" | "name" | "category" | "onHand" | "reorderLevel" | "unitCostSen" | "status";

export type ProductListQuery = z.infer<typeof productListQuerySchema>;

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
  id: string;
  sku: string;
  name: string;
  category: string;
  supplier: string;
  unitCostSen: number;
  onHand: number;
  reorderLevel: number;
  status: StockStatus;
  stockValueSen: number;
  lastMovementAt: string | null;
  stockByStore: StockByStore[];
};

export type StockHistoryPoint = {
  date: string;
  onHand: number;
};

export type StockHistory = {
  points: StockHistoryPoint[];
  reorderLevel: number;
};
