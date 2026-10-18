"use client";

import { ACTION, ALL_STORES } from "@/constants";
import { DownloadIcon, UploadIcon } from "@/components/icons";
import { useCan } from "@/components/providers/session-provider";
import { useQueryMeta } from "@/lib/client/apiHooks";
import type { MetaResponse } from "@/lib/types/meta";
import type { StoreScope } from "@/lib/types/store";

interface ProductsHeaderProps {
  totalProducts: number;
  store: StoreScope;
}

const SYNCED_TEXT = "synced 2 min ago"; // TODO(hanie): wire to the last update time

export function ProductsHeader({ totalProducts, store }: ProductsHeaderProps): React.ReactElement {
  const canImport = useCan(ACTION.IMPORT);
  const { data: meta } = useQueryMeta();

  let storeContextText = "across 6 stores";
  if (meta) {
    if (store === ALL_STORES) {
      storeContextText = `across ${meta.stores.length} stores`;
    } else {
      const currentStore = meta.stores.find((s) => s.id === store);
      storeContextText = currentStore ? `at ${currentStore.name}` : "";
    }
  }

  const subtitle = `${totalProducts} products ${storeContextText} · ${SYNCED_TEXT}`;

  return (
    <div className="flex items-start justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-page-title text-text-primary">Products</h1>
        <p className="text-body-small text-text-secondary">{subtitle}</p>
      </div>

      <div className="gap-md flex items-center">
        <button
          type="button"
          className="border-border-default bg-bg-surface hover:bg-bg-subtle text-text-primary text-label inline-flex h-9 items-center gap-2 rounded-md border px-3 transition-colors"
        >
          <DownloadIcon className="size-4 shrink-0" />
          <span>Export</span>
        </button>

        {canImport && (
          <button
            type="button"
            className="bg-accent-default hover:bg-accent-hover text-text-on-accent text-label inline-flex h-9 items-center gap-2 rounded-md px-3 transition-colors"
          >
            <UploadIcon className="size-4 shrink-0" />
            <span>Import CSV</span>
          </button>
        )}
      </div>
    </div>
  );
}
