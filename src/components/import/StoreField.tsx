import type { ReactElement } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SupplierIcon } from "@/components/icons";
import { cn } from "@/helpers";
import type { Store } from "@/types";

export interface StoreFieldProps {
  storeId: string;
  stores: readonly Store[];
  onStoreChange: (storeId: string) => void;
  disabled?: boolean;
  className?: string;
}

export function StoreField({
  storeId,
  stores,
  onStoreChange,
  disabled = false,
  className,
}: StoreFieldProps): ReactElement {
  const selectedStore = stores.find((s) => s.id === storeId);
  const displayName = selectedStore ? selectedStore.name : "Select a store";

  return (
    <div className={cn("mt-6 flex flex-col gap-2", className)}>
      <label
        htmlFor="import-store-select"
        className="text-label text-text-secondary font-medium"
      >
        Import into store
      </label>

      <Select
        value={storeId}
        onValueChange={onStoreChange}
        disabled={disabled}
      >
        <SelectTrigger
          id="import-store-select"
          className="h-9 w-full bg-bg-surface border-border-default flex items-center gap-2"
        >
          <SupplierIcon className="size-4 shrink-0 text-text-tertiary" />
          <SelectValue placeholder="Select a store">
            {displayName}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {stores.map((store) => (
            <SelectItem key={store.id} value={store.id}>
              {store.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <p className="text-caption text-text-tertiary mt-0.5">
        Quantities in the file set the on-hand count at this store only. Other stores are not touched.
      </p>
    </div>
  );
}
