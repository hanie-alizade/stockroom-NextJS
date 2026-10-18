"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/common";
import { ProductsSortHeader } from "./ProductsSortHeader";
import { cn, formatMoney, formatWhen } from "@/helpers";
import { ALL_STORES, PRODUCT_SORT_KEY } from "@/constants";
import type {
  ProductListItem,
  ProductSortKey,
  SortDirection,
  StoreScope,
} from "@/types";

interface ProductsTableProps {
  items: ProductListItem[];
  isLoading: boolean;
  isError: boolean;
  store: StoreScope;
  sort?: ProductSortKey;
  dir?: SortDirection;
  onSort: (column: ProductSortKey) => void;
}

export function ProductsTable({
  items,
  isLoading,
  isError,
  store,
  sort,
  dir,
  onSort,
}: ProductsTableProps): React.ReactElement {
  const router = useRouter();
  const now = useMemo(() => new Date(), []);
  const storeParam = store && store !== ALL_STORES ? `?store=${store}` : "";

  const handleRowClick = (id: string): void => {
    router.push(`/products/${id}${storeParam}`);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-left">
        <thead>
          <tr className="bg-bg-subtle border-border-default h-10 border-y">
            <th scope="col" className="w-[44px] px-md text-center align-middle">
              <div
                className="inline-flex items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox aria-label="Select all rows" />
              </div>
            </th>

            <ProductsSortHeader
              column={PRODUCT_SORT_KEY.SKU}
              label="SKU"
              currentSort={sort}
              currentDir={dir}
              onSort={onSort}
              className="w-[100px]"
            />

            <ProductsSortHeader
              column={PRODUCT_SORT_KEY.NAME}
              label="Product"
              currentSort={sort}
              currentDir={dir}
              onSort={onSort}
            />

            <ProductsSortHeader
              column={PRODUCT_SORT_KEY.CATEGORY}
              label="Category"
              currentSort={sort}
              currentDir={dir}
              onSort={onSort}
              className="w-[130px]"
            />

            <ProductsSortHeader
              column={PRODUCT_SORT_KEY.ON_HAND}
              label="On hand"
              currentSort={sort}
              currentDir={dir}
              onSort={onSort}
              align="right"
            />

            <ProductsSortHeader
              column={PRODUCT_SORT_KEY.REORDER_LEVEL}
              label="Reorder at"
              currentSort={sort}
              currentDir={dir}
              onSort={onSort}
              align="right"
            />

            <th
              scope="col"
              className="text-label text-text-secondary px-md h-10 select-none align-middle"
            >
              Status
            </th>

            <ProductsSortHeader
              column={PRODUCT_SORT_KEY.UNIT_COST_SEN}
              label="Unit cost"
              currentSort={sort}
              currentDir={dir}
              onSort={onSort}
              align="right"
            />

            <ProductsSortHeader
              column={PRODUCT_SORT_KEY.UPDATED_AT}
              label="Updated"
              currentSort={sort}
              currentDir={dir}
              onSort={onSort}
            />

            <th scope="col" className="w-[44px] pr-md text-right align-middle">
              <span className="sr-only">Row actions</span>
            </th>
          </tr>
        </thead>

        <tbody>
          {isLoading && items.length === 0 && (
            <tr>
              <td colSpan={10} className="p-8 text-center text-body text-text-secondary">
                {/* TODO(hanie): states design */}
                Loading...
              </td>
            </tr>
          )}

          {isError && items.length === 0 && (
            <tr>
              <td colSpan={10} className="p-8 text-center text-body text-status-danger-fg">
                {/* TODO(hanie): states design */}
                Something went wrong
              </td>
            </tr>
          )}

          {!isLoading && !isError && items.length === 0 && (
            <tr>
              <td colSpan={10} className="p-8 text-center text-body text-text-secondary">
                {/* TODO(hanie): states design */}
                No results
              </td>
            </tr>
          )}

          {items.map((item) => (
            <tr
              key={item.id}
              onClick={() => handleRowClick(item.id)}
              className="border-border-default hover:bg-bg-subtle h-[52px] cursor-pointer border-b transition-colors"
            >
              <td
                className="w-[44px] px-md text-center align-middle"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="inline-flex items-center">
                  <Checkbox aria-label="Select row" />
                </div>
              </td>

              <td className="text-mono text-text-secondary px-md align-middle whitespace-nowrap">
                {item.sku}
              </td>

              <td className="px-md align-middle">
                <div className="flex flex-col">
                  <Link
                    href={`/products/${item.id}${storeParam}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-body-strong text-text-primary hover:underline"
                  >
                    {item.name}
                  </Link>
                  <span className="text-caption text-text-tertiary">
                    {item.supplier}
                  </span>
                </div>
              </td>

              <td className="text-body text-text-secondary px-md align-middle whitespace-nowrap">
                {item.category}
              </td>

              <td className="px-md text-right align-middle whitespace-nowrap">
                <span
                  className={cn(
                    "text-mono-strong",
                    item.onHand === 0
                      ? "text-status-danger-fg"
                      : "text-text-primary",
                  )}
                >
                  {item.onHand}
                </span>
              </td>

              <td className="text-mono text-text-tertiary px-md text-right align-middle whitespace-nowrap">
                {item.reorderLevel}
              </td>

              <td className="px-md align-middle whitespace-nowrap">
                <StatusBadge status={item.status} />
              </td>

              <td className="text-mono text-text-secondary px-md text-right align-middle whitespace-nowrap">
                {formatMoney(item.unitCostSen)}
              </td>

              <td className="text-body-small text-text-secondary px-md align-middle whitespace-nowrap">
                {formatWhen(item.updatedAt, now)}
              </td>

              <td
                className="w-[44px] pr-md text-right align-middle"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  aria-label="Row actions"
                  className="text-text-tertiary hover:text-text-primary inline-flex size-8 items-center justify-center rounded-md text-sm transition-colors"
                >
                  ···
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
