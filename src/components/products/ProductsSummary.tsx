import { ALL_STORES } from "@/constants";
import { StatCard } from "@/components/common";
import { formatMoney } from "@/helpers";
import type { ProductListSummary, StoreScope } from "@/types";

interface ProductsSummaryProps {
  summary: ProductListSummary;
  store: StoreScope;
}

export function ProductsSummary({
  summary,
  store,
}: ProductsSummaryProps): React.ReactElement {
  const isAllStores = store === ALL_STORES;

  return (
    <div className="grid grid-cols-1 gap-lg sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Products"
        value={summary.totalProducts}
        subtitle={isAllStores ? "Across 6 categories" : "Active at this store"}
      />
      <StatCard
        label="Stock value"
        value={formatMoney(summary.stockValueSen, { withCurrency: true })}
        subtitle={isAllStores ? "At unit cost, all stores" : "At unit cost"}
      />
      <StatCard
        label="Low stock"
        value={summary.lowStock}
        subtitle="At or below reorder level"
        variant="warn"
      />
      <StatCard
        label="Out of stock"
        value={summary.outOfStock}
        subtitle="Needs a reorder"
        variant="danger"
      />
    </div>
  );
}
