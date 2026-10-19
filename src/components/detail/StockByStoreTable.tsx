import type { ReactElement } from "react";
import { STOCK_STATUS } from "@/constants";
import { formatWhen, cn } from "@/helpers";
import { StatusBadge } from "@/components/common";
import { SupplierIcon } from "@/components/icons";
import type { StockByStore, Store } from "@/types";

export interface StockByStoreTableProps {
  stockByStore: StockByStore[];
  stores: Store[];
  onAdjust: (storeId: string) => void;
}

export function StockByStoreTable({
  stockByStore,
  stores,
  onAdjust,
}: StockByStoreTableProps): ReactElement {
  const storeMap = new Map(stores.map((s) => [s.id, s.name]));

  const totalCarryingStores = stockByStore.length;
  const attentionCount = stockByStore.filter(
    (s) => s.status === STOCK_STATUS.LOW || s.status === STOCK_STATUS.OUT,
  ).length;

  return (
    <div className="bg-bg-surface border-border-default shadow-card overflow-hidden rounded-lg border">
      <div className="border-border-default px-xl flex h-[52px] items-center justify-between border-b">
        <h2 className="text-card text-text-primary">Stock by store</h2>
        {attentionCount > 0 && (
          <span className="text-body-small text-status-warn-fg">
            {attentionCount} of {totalCarryingStores} stores need attention
          </span>
        )}
      </div>

      <div className="w-full min-w-[800px] overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-bg-subtle border-border-default h-10 border-b">
              <th
                scope="col"
                className="text-label text-text-secondary pl-xl px-md text-left font-medium"
              >
                Store
              </th>
              <th
                scope="col"
                className="text-label text-text-secondary px-md w-[120px] text-right font-medium"
              >
                On hand
              </th>
              <th
                scope="col"
                className="text-label text-text-secondary px-md w-[120px] text-right font-medium"
              >
                Reorder at
              </th>
              <th
                scope="col"
                className="text-label text-text-secondary px-md w-[150px] text-left font-medium"
              >
                Status
              </th>
              <th
                scope="col"
                className="text-label text-text-secondary px-md w-[180px] text-left font-medium"
              >
                Last movement
              </th>
              <th
                scope="col"
                className="text-label text-text-secondary pr-xl px-md w-[107px] text-right font-medium"
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
                  className={cn("border-border-default h-11", !isLast && "border-b")}
                >
                  <td className="pl-xl px-md">
                    <div className="gap-sm flex items-center">
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
                  <td className="text-body-small text-text-tertiary px-md">{formattedLast}</td>
                  <td className="pr-xl px-md text-right">
                    <button
                      type="button"
                      onClick={() => onAdjust(item.storeId)}
                      className="text-label text-text-link cursor-pointer hover:underline"
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
  );
}
