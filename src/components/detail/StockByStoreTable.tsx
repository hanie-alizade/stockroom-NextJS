import type { ReactElement } from "react";
import { STOCK_STATUS } from "@/constants";
import { formatWhen, cn } from "@/helpers";
import { ProgressBar, StatusBadge } from "@/components/common";
import { SupplierIcon } from "@/components/icons";
import type { StockByStore, Store } from "@/types";

export interface StockByStoreTableProps {
  stockByStore: StockByStore[];
  stores: Store[];
  onAdjust: (storeId: string) => void;
  isFetching?: boolean;
}

export function StockByStoreTable({
  stockByStore,
  stores,
  onAdjust,
  isFetching,
}: StockByStoreTableProps): ReactElement {
  const storeMap = new Map(stores.map((s) => [s.id, s.name]));

  const totalCarryingStores = stockByStore.length;
  const attentionCount = stockByStore.filter(
    (s) => s.status === STOCK_STATUS.LOW || s.status === STOCK_STATUS.OUT,
  ).length;

  return (
    <div className="relative bg-bg-surface border-border-default shadow-card rounded-lg border overflow-hidden">
      {isFetching && <ProgressBar className="absolute top-0 left-0 right-0 z-10" />}
      <div className={cn("transition-opacity", isFetching && "opacity-60")}>
        <div className="border-border-default flex h-[52px] items-center justify-between border-b px-xl">
          <h2 className="text-card text-text-primary">Stock by store</h2>
          {attentionCount > 0 && (
            <span className="text-body-small text-status-warn-fg">
              {attentionCount} of {totalCarryingStores} stores need attention
            </span>
          )}
        </div>

        <div className="relative overflow-x-auto w-full">
          <table aria-busy={isFetching} className="w-full min-w-[800px] border-collapse">
          <thead>
            <tr className="bg-bg-subtle border-border-default h-10 border-b">
              <th
                scope="col"
                className="text-label text-text-secondary pl-xl px-md text-left font-medium sticky left-0 z-10 bg-bg-subtle border-r border-border-default shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] min-w-[160px]"
              >
                Store
              </th>
              <th
                scope="col"
                className="text-label text-text-secondary w-[120px] px-md text-right font-medium"
              >
                On hand
              </th>
              <th
                scope="col"
                className="text-label text-text-secondary w-[120px] px-md text-right font-medium"
              >
                Reorder at
              </th>
              <th
                scope="col"
                className="text-label text-text-secondary w-[150px] px-md text-left font-medium"
              >
                Status
              </th>
              <th
                scope="col"
                className="text-label text-text-secondary w-[180px] px-md text-left font-medium"
              >
                Last movement
              </th>
              <th
                scope="col"
                className="text-label text-text-secondary w-[107px] pr-xl px-md text-right font-medium"
              >
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {stockByStore.map((item, index) => {
              const storeName = storeMap.get(item.storeId) ?? item.storeId;
              const isLast = index === stockByStore.length - 1;
              const formattedLast = item.lastMovementAt
                ? formatWhen(item.lastMovementAt, new Date())
                : "—";

              return (
                <tr
                  key={item.storeId}
                  className={cn(
                    "h-11 border-border-default",
                    !isLast && "border-b",
                  )}
                >
                  <td className="pl-xl px-md sticky left-0 z-10 bg-bg-surface border-r border-border-default shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                    <div className="flex items-center gap-sm">
                      <SupplierIcon className="text-text-tertiary size-4 shrink-0" />
                      <span className="text-body-strong text-text-primary">{storeName}</span>
                    </div>
                  </td>
                  <td
                    className={cn(
                      "text-mono-strong px-md text-right",
                      item.onHand === 0 ? "text-status-danger-fg" : "text-text-primary",
                    )}
                  >
                    {item.onHand}
                  </td>
                  <td className="text-mono text-text-tertiary px-md text-right">
                    {item.reorderLevel}
                  </td>
                  <td className="px-md">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="text-body-small text-text-tertiary px-md">
                    {formattedLast}
                  </td>
                  <td className="pr-xl px-md text-right">
                    <button
                      type="button"
                      onClick={() => onAdjust(item.storeId)}
                      className={cn("text-label text-text-link hover:underline cursor-pointer", isFetching && "pointer-events-none")}
                      aria-label={`Adjust stock at ${storeName}`}
                    >
                      Adjust
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
