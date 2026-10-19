import type { ReactElement } from "react";
import Link from "next/link";
import { ALL_STORES } from "@/constants";
import { formatMoney } from "@/helpers";
import { ChevronRightIcon } from "@/components/icons";
import { StatusBadge } from "@/components/common";
import type { StockStatus, StoreScope } from "@/types";

export interface ProductDetailHeaderProps {
  name: string;
  sku: string;
  category: string;
  supplier: string;
  unitCostSen: number;
  status: StockStatus;
  store: StoreScope;
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
  onAdjust,
}: ProductDetailHeaderProps): ReactElement {
  const productsHref = store && store !== ALL_STORES ? `/products?store=${store}` : "/products";

  const formattedCost = `${formatMoney(unitCostSen, { withCurrency: true })} per unit`;
  const metaText = `${category} \u00B7 ${supplier} \u00B7 ${formattedCost}`;

  return (
    <div className="flex flex-col">
      <nav aria-label="Breadcrumb" className="pb-xs">
        <ol className="gap-sm text-body-small flex items-center">
          <li>
            <Link href={productsHref} className="text-text-link hover:underline">
              Products
            </Link>
          </li>
          <li>
            <ChevronRightIcon className="text-text-tertiary size-3.5 shrink-0" />
          </li>
          <li>
            <span className="text-text-secondary truncate" aria-current="page">
              {name}
            </span>
          </li>
        </ol>
      </nav>

      <div className="flex h-14 items-center justify-between">
        <div className="flex flex-col">
          <div className="gap-md flex items-center">
            <h1 className="text-page-title text-text-primary">{name}</h1>
            <StatusBadge status={status} />
          </div>
          <div className="mt-xs gap-sm flex items-center">
            <span className="bg-bg-muted text-mono text-text-secondary px-sm inline-flex h-5 items-center rounded-sm">
              {sku}
            </span>
            <span className="text-body-small text-text-secondary">{metaText}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onAdjust(store !== ALL_STORES ? store : undefined)}
          className="bg-accent-default hover:bg-accent-hover text-text-on-accent text-label px-xl flex h-9 cursor-pointer items-center justify-center rounded-md"
        >
          Adjust stock
        </button>
      </div>
    </div>
  );
}
