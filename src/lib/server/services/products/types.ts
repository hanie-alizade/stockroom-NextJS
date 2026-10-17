import type { StockStatus } from "@/lib/domain/status";
import type { Movement } from "@/lib/server/repo";

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

export type ProductSummary = {
  totalProducts: number;
  stockValueSen: number;
  lowStock: number;
  outOfStock: number;
};

export type ProductListResult = {
  items: ProductListItem[];
  page: number;
  pageSize: number;
  total: number;
  summary: ProductSummary;
};

export type ProductDetail = {
  sku: string;
  name: string;
  category: string;
  supplier: string;
  unitCostSen: number;
  stockValueSen: number;
  lastMovementAt: string | null;
  stockByStore: Array<{
    storeId: string;
    onHand: number;
    reorderLevel: number;
    status: StockStatus;
    lastMovementAt: string | null;
  }>;
};

export type MovementWithUser = Movement & { createdBy: string };

export type ProductMovementsResult = {
  items: MovementWithUser[];
  page: number;
  pageSize: number;
  total: number;
};

export type StockHistoryPoint = {
  date: string;
  onHand: number;
  reorderLevel: number;
};

export type StockHistoryResult = {
  points: StockHistoryPoint[];
  days: number;
};
