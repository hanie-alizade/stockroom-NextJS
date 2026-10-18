"use client";

import Link from "next/link";
import { ACTION, ALL_STORES } from "@/constants";
import { UploadIcon } from "@/components/icons";
import { useCan } from "@/providers";
import { useQueryMeta } from "@/apiHooks";
import type { StoreScope } from "@/types";

interface ProductsHeaderProps {
  totalProducts: number;
  store: StoreScope;
}

export function ProductsHeader({ totalProducts, store }: ProductsHeaderProps): React.ReactElement {
  const canImport = useCan(ACTION.IMPORT);
  const { data: meta } = useQueryMeta();

  const storeCount = meta?.stores.length;
  let storeContextText = storeCount ? `across ${storeCount} stores` : "";
  if (meta) {
    if (store === ALL_STORES) {
      storeContextText = `across ${meta.stores.length} stores`;
    } else {
      const currentStore = meta.stores.find((s) => s.id === store);
      storeContextText = currentStore ? `at ${currentStore.name}` : `at ${store}`;
    }
  }

  const subtitle = storeContextText
    ? `${totalProducts} products ${storeContextText}`
    : `${totalProducts} products`;

  return (
    <div className="flex items-start justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-page-title text-text-primary">Products</h1>
        <p className="text-body-small text-text-secondary">{subtitle}</p>
      </div>

      <div className="gap-md flex items-center">
        {canImport && (
          <Link
            href="/import"
            className="bg-accent-default hover:bg-accent-hover text-text-on-accent text-label inline-flex h-9 items-center gap-2 rounded-md px-3 transition-colors"
          >
            <UploadIcon className="size-4 shrink-0" />
            <span>Import CSV</span>
          </Link>
        )}
      </div>
    </div>
  );
}
