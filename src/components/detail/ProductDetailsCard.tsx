import type { ReactElement } from "react";
import { ALL_STORES } from "@/constants";
import { cn, formatMoney, formatWhen } from "@/helpers";
import { ProgressBar } from "@/components/common";
import type { StoreScope } from "@/types";

export interface ProductDetailsCardProps {
  onHand: number;
  reorderLevel: number;
  unitCostSen: number;
  stockValueSen: number;
  supplier: string | null;
  lastMovementAt: string | null;
  store: StoreScope;
  isFetching?: boolean;
}

export function ProductDetailsCard({
  onHand,
  reorderLevel,
  unitCostSen,
  stockValueSen,
  supplier,
  lastMovementAt,
  store,
  isFetching,
}: ProductDetailsCardProps): ReactElement {
  const onHandLabel = store === ALL_STORES ? "On hand (all stores)" : "On hand";
  const formattedLastMovement = lastMovementAt
    ? formatWhen(lastMovementAt, new Date())
    : "—";

  return (
    <div
      aria-busy={isFetching}
      className="relative bg-bg-surface border-border-default shadow-card rounded-lg border p-xl overflow-hidden"
    >
      {isFetching && <ProgressBar className="absolute top-0 left-0 right-0 z-10" />}
      <div className={cn("transition-opacity", isFetching && "opacity-60")}>
        <h2 className="text-card text-text-primary">Details</h2>
      <dl className="mt-sm flex flex-col">
        <div className="flex h-9 items-center justify-between">
          <dt className="text-body-small text-text-secondary">{onHandLabel}</dt>
          <dd className="text-mono-strong text-text-primary">{onHand}</dd>
        </div>
        <div className="flex h-9 items-center justify-between">
          <dt className="text-body-small text-text-secondary">Reorder level</dt>
          <dd className="text-mono-strong text-text-primary">{reorderLevel}</dd>
        </div>
        <div className="flex h-9 items-center justify-between">
          <dt className="text-body-small text-text-secondary">Unit cost</dt>
          <dd className="text-mono-strong text-text-primary">
            {formatMoney(unitCostSen, { withCurrency: true })}
          </dd>
        </div>
        <div className="flex h-9 items-center justify-between">
          <dt className="text-body-small text-text-secondary">Stock value</dt>
          <dd className="text-mono-strong text-text-primary">
            {formatMoney(stockValueSen, { withCurrency: true })}
          </dd>
        </div>
        <div className="flex h-9 items-center justify-between">
          <dt className="text-body-small text-text-secondary">Supplier</dt>
          <dd className="text-label text-text-primary">{supplier ?? "—"}</dd>
        </div>
        <div className="flex h-9 items-center justify-between">
          <dt className="text-body-small text-text-secondary">Last movement</dt>
          <dd className="text-label text-text-primary">{formattedLastMovement}</dd>
        </div>
      </dl>
      </div>
    </div>
  );
}
