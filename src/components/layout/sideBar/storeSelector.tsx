"use client";

import { SupplierIcon } from "@/components/icons";
import { ChevronDownIcon } from "@/components/icons";

export function StoreSelector(): React.ReactElement {
  return (
    <div className="mb-4">
      <button
        type="button"
        className="border-border-default bg-bg-surface text-text-primary hover:bg-bg-subtle focus-visible:ring-border-focus flex h-8 w-full items-center gap-2 rounded-md border px-3 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <SupplierIcon className="shrink-0" />
        <span className="text-body flex-1 text-left">All stores (6)</span>
        <ChevronDownIcon className="shrink-0" />
      </button>
    </div>
  );
}
