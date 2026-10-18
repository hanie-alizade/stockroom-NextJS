import type { ReactElement } from "react";
import {
  ALL_STORES,
  MOVEMENT_TYPE,
  MOVEMENT_TYPE_LABEL,
  PERIOD,
  PERIOD_LABEL,
} from "@/constants";
import { SupplierIcon } from "@/components/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MovementPeriod, MovementType, Store, StoreScope } from "@/types";

export interface MovementsFiltersProps {
  type?: MovementType;
  store: StoreScope;
  period: MovementPeriod;
  total: number;
  stores: Store[];
  onTypeChange: (type?: MovementType) => void;
  onStoreChange: (store: StoreScope) => void;
  onPeriodChange: (period: MovementPeriod) => void;
}

export function MovementsFilters({
  type,
  store,
  period,
  total,
  stores,
  onTypeChange,
  onStoreChange,
  onPeriodChange,
}: MovementsFiltersProps): ReactElement {
  const movementTypes = Object.values(MOVEMENT_TYPE);
  const typeLabel = type ? MOVEMENT_TYPE_LABEL[type] : "All types";
  const storeLabel =
    store === ALL_STORES
      ? "All stores"
      : (stores.find((s) => s.id === store)?.name ?? store);
  const periodLabel = PERIOD_LABEL[period] ?? "Last 30 days";

  return (
    <div className="flex items-center gap-lg">
      <Select
        value={type ?? "all"}
        onValueChange={(val) => onTypeChange(val === "all" ? undefined : (val as MovementType))}
      >
        <SelectTrigger className="border-border-default bg-bg-surface text-body h-10 w-[152px] rounded-md">
          <SelectValue placeholder="All types">{typeLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          {movementTypes.map((t) => (
            <SelectItem key={t} value={t}>
              {MOVEMENT_TYPE_LABEL[t]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={store} onValueChange={(val) => onStoreChange(val as StoreScope)}>
        <SelectTrigger className="border-border-default bg-bg-surface text-body h-10 w-[164px] rounded-md">
          <div className="flex items-center gap-sm overflow-hidden">
            <SupplierIcon className="text-text-tertiary size-4 shrink-0" />
            <SelectValue placeholder="All stores">{storeLabel}</SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_STORES}>All stores</SelectItem>
          {stores.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={period}
        onValueChange={(val) => onPeriodChange(val as MovementPeriod)}
      >
        <SelectTrigger className="border-border-default bg-bg-surface text-body h-10 w-[184px] rounded-md">
          <SelectValue placeholder="Last 30 days">{periodLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={PERIOD.DAYS_7}>{PERIOD_LABEL[PERIOD.DAYS_7]}</SelectItem>
          <SelectItem value={PERIOD.DAYS_30}>{PERIOD_LABEL[PERIOD.DAYS_30]}</SelectItem>
          <SelectItem value={PERIOD.DAYS_90}>{PERIOD_LABEL[PERIOD.DAYS_90]}</SelectItem>
        </SelectContent>
      </Select>


      <div className="text-body-small text-text-tertiary ml-auto" aria-live="polite">
        {total === 1 ? "1 movement" : `${total} movements`}
      </div>
    </div>
  );
}
