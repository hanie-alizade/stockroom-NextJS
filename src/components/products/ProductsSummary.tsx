import { ALL_STORES, STOCK_STATUS } from "@/constants";
import { StatCard } from "@/components/common";
import { formatMoney } from "@/helpers";
import type { ProductListSummary, StockStatus, StoreScope } from "@/types";

interface ProductsSummaryProps {
  summary: ProductListSummary;
  store: StoreScope;
  isLoading?: boolean;
  categoriesCount?: number;
  currentStatus?: StockStatus;
  onStatusChange?: (status?: StockStatus) => void;
}

const DASH = "\u2014";

export function ProductsSummary({
  summary,
  store,
  isLoading = false,
  categoriesCount,
  currentStatus,
  onStatusChange,
}: ProductsSummaryProps): React.ReactElement {
  const isAllStores = store === ALL_STORES;

  const handleLowStockClick = onStatusChange
    ? () => {
        onStatusChange(currentStatus === STOCK_STATUS.LOW ? undefined : STOCK_STATUS.LOW);
      }
    : undefined;

  const handleOutOfStockClick = onStatusChange
    ? () => {
        onStatusChange(currentStatus === STOCK_STATUS.OUT ? undefined : STOCK_STATUS.OUT);
      }
    : undefined;

  const categoriesSubtitle =
    categoriesCount !== undefined ? `Across ${categoriesCount} categories` : "Across categories";

  return (
    <div className="gap-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Products"
        value={isLoading ? DASH : summary.totalProducts}
        subtitle={isAllStores ? categoriesSubtitle : "Active at this store"}
      />
      <StatCard
        label="Stock value"
        value={isLoading ? DASH : formatMoney(summary.stockValueSen, { withCurrency: true })}
        subtitle={isAllStores ? "At unit cost, all stores" : "At unit cost"}
      />
      <StatCard
        label="Low stock"
        value={isLoading ? DASH : summary.lowStock}
        subtitle="At or below reorder level"
        variant="warn"
        onClick={handleLowStockClick}
        selected={currentStatus === STOCK_STATUS.LOW}
      />
      <StatCard
        label="Out of stock"
        value={isLoading ? DASH : summary.outOfStock}
        subtitle="Needs a reorder"
        variant="danger"
        onClick={handleOutOfStockClick}
        selected={currentStatus === STOCK_STATUS.OUT}
      />
    </div>
  );
}
