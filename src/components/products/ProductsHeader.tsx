"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ALL_STORES, PERMISSION } from "@/constants";
import { DownloadIcon, UploadIcon } from "@/components/icons";
import { PermissionGate } from "@/components/common";
import { useQueryMeta } from "@/apiHooks";
import { formatRelativeTime } from "@/helpers";
import { useNow } from "@/hooks";
import type { StoreScope } from "@/types";

const emptySubscribe = () => () => {};

interface ProductsHeaderProps {
  totalProducts: number;
  store: StoreScope;
  dataUpdatedAt?: number;
  onExport?: () => void;
  isExporting?: boolean;
}

export function ProductsHeader({
  totalProducts,
  store,
  dataUpdatedAt,
  onExport,
  isExporting = false,
}: ProductsHeaderProps): React.ReactElement {
  const { data: meta } = useQueryMeta();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const now = useNow(30_000);

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

  const baseSubtitle = storeContextText
    ? `${totalProducts} products ${storeContextText}`
    : `${totalProducts} products`;

  const syncedText =
    mounted && dataUpdatedAt
      ? `synced ${formatRelativeTime(dataUpdatedAt, now)}`
      : null;

  const subtitle = syncedText ? `${baseSubtitle} · ${syncedText}` : baseSubtitle;

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-page-title text-text-primary">Products</h1>
        <p className="text-body-small text-text-secondary">{subtitle}</p>
      </div>

      <div className="gap-md flex flex-wrap sm:flex-nowrap items-center w-full sm:w-auto">
        <button
          type="button"
          onClick={onExport}
          disabled={isExporting || totalProducts === 0}
          aria-busy={isExporting}
          className="flex-1 sm:flex-initial border-border-default bg-bg-surface hover:bg-bg-subtle text-text-primary text-label inline-flex min-h-11 sm:min-h-9 h-11 sm:h-9 cursor-pointer items-center justify-center gap-2 rounded-md border px-3 transition-colors disabled:pointer-events-none disabled:opacity-50"
        >
          <DownloadIcon className="size-4 shrink-0" />
          <span>{isExporting ? "Exporting…" : "Export"}</span>
        </button>

        <PermissionGate permission={PERMISSION.IMPORT}>
          <Link
            href="/import"
            className="flex-1 sm:flex-initial bg-accent-default hover:bg-accent-hover text-text-on-accent text-label inline-flex min-h-11 sm:min-h-9 h-11 sm:h-9 items-center justify-center gap-2 rounded-md px-3 transition-colors text-center"
          >
            <UploadIcon className="size-4 shrink-0" />
            <span>Import CSV</span>
          </Link>
        </PermissionGate>
      </div>
    </div>
  );
}

