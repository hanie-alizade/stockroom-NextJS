import type { ReactElement } from "react";
import Link from "next/link";
import { ALL_STORES } from "@/constants";
import { formatMoney } from "@/helpers";
import { ChevronRightIcon } from "@/components/icons";
import { StatusBadge } from "@/components/common";
import type { StockByStore, StockStatus, StoreScope } from "@/types";

export interface ProductDetailHeaderProps {
  name: string;
  sku: string;
  category: string;
  supplier: string;
  unitCostSen: number;
  status: StockStatus;
  store: StoreScope;
  stockByStore?: StockByStore[];
  isCarried?: boolean;
  onAdjust: (storeId?: string) => void;
}

export function ProductDetailHeader({
  name,
  sku,
  category,
  supplier,
  unitCostSen,
  status,
  store,
  stockByStore,
  isCarried,
  onAdjust,
}: ProductDetailHeaderProps): ReactElement {
  const productsHref =
    store && store !== ALL_STORES ? `/products?store=${store}` : "/products";

  const formattedCost = `${formatMoney(unitCostSen, { withCurrency: true })} per unit`;
  const metaText = `${category} \u00B7 ${supplier} \u00B7 ${formattedCost}`;

  const isCarriedAtStore =
    isCarried !== undefined
      ? isCarried
      : store === ALL_STORES || (stockByStore !== undefined ? stockByStore.length > 0 : true);

  return (
    <div className="flex flex-col">
      <nav aria-label="Breadcrumb" className="pb-xs">
        <ol className="flex items-center gap-sm text-body-small min-w-0">
          <li className="shrink-0">
            <Link href={productsHref} className="text-text-link hover:underline">
              Products
            </Link>
          </li>
          <li className="shrink-0">
            <ChevronRightIcon className="text-text-tertiary size-3.5 shrink-0" />
          </li>
          <li className="min-w-0">
            <span className="text-text-secondary truncate block max-w-[200px] sm:max-w-none" aria-current="page">
              {name}
            </span>
          </li>
        </ol>
      </nav>

      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 py-2 lg:py-0 lg:h-14">
        <div className="flex flex-col min-w-0">
          <div className="flex flex-wrap items-center gap-md">
            <h1 className="text-page-title text-text-primary">{name}</h1>
            {isCarriedAtStore && <StatusBadge status={status} />}
          </div>
          <div className="mt-xs flex flex-wrap items-center gap-sm">
            <span className="bg-bg-muted text-mono text-text-secondary inline-flex h-5 items-center rounded-sm px-sm shrink-0">
              {sku}
            </span>
            <span className="text-body-small text-text-secondary">{metaText}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onAdjust(store !== ALL_STORES ? store : undefined)}
          className="bg-accent-default hover:bg-accent-hover text-text-on-accent text-label flex h-11 lg:h-9 w-full sm:w-auto items-center justify-center rounded-md px-xl cursor-pointer shrink-0"
        >
          Adjust stock
        </button>
      </div>
    </div>
  );
}
