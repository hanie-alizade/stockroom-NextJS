"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SupplierIcon } from "@/components/icons";
import { ALL_STORES } from "@/constants";
import { useQueryMeta } from "@/lib/client/apiHooks/useCommonAPIs";

export function StoreSelector(): React.ReactElement {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { data: meta, isLoading, isError } = useQueryMeta();

  const currentStore = searchParams.get("store");

  if (isLoading) {
    return (
      <div className="mb-4">
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (isError || !meta) {
    return (
      <div className="mb-4">
        <button
          type="button"
          disabled
          className="border-border-default bg-bg-surface text-text-primary flex h-8 w-full cursor-not-allowed items-center gap-2 rounded-md border px-3 text-sm opacity-50"
        >
          <SupplierIcon className="shrink-0" />
          <span className="text-body flex-1 text-left">All stores</span>
        </button>
      </div>
    );
  }

  const validStoreIds = new Set(meta.stores.map((s) => s.id));
  const isValidStore = currentStore && validStoreIds.has(currentStore);
  const value = isValidStore ? currentStore : ALL_STORES;

  const handleValueChange = (newValue: string): void => {
    const params = new URLSearchParams(searchParams.toString());
    if (newValue === ALL_STORES) {
      params.delete("store");
    } else {
      params.set("store", newValue);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="mb-4">
      <Select value={value} onValueChange={handleValueChange}>
        <SelectTrigger className="h-8 w-full" data-size="sm">
          <SupplierIcon className="shrink-0" />
          <SelectValue className="flex-1 text-left" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_STORES}>All stores ({meta.stores.length})</SelectItem>
          {meta.stores.map((store) => (
            <SelectItem key={store.id} value={store.id}>
              {store.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
