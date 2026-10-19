"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { ProductsSortHeader } from "./ProductsSortHeader";
import { PRODUCT_SORT_KEY } from "@/constants";
import type { ProductSortKey, SortDirection } from "@/types";

interface ProductsTableHeadProps {
  sort?: ProductSortKey;
  dir?: SortDirection;
  onSort: (column: ProductSortKey) => void;
  isAllSelected: boolean;
  isPartiallySelected: boolean;
  onToggleAll: () => void;
}

export function ProductsTableHead({
  sort,
  dir,
  onSort,
  isAllSelected,
  isPartiallySelected,
  onToggleAll,
}: ProductsTableHeadProps): React.ReactElement {
  let checkedState: boolean | "indeterminate" = false;
  if (isAllSelected) {
    checkedState = true;
  } else if (isPartiallySelected) {
    checkedState = "indeterminate";
  }

  return (
    <thead>
      <tr className="bg-bg-subtle border-border-default h-10 border-y">
        <th scope="col" className="px-md w-[44px] text-center align-middle">
          <div className="inline-flex items-center" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              aria-label="Select all rows"
              checked={checkedState}
              onCheckedChange={onToggleAll}
            />
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

        <ProductsSortHeader
          column={PRODUCT_SORT_KEY.STATUS}
          label="Status"
          currentSort={sort}
          currentDir={dir}
          onSort={onSort}
          hideInactiveIcon={true}
        />

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

        <th scope="col" className="pr-md w-[44px] text-right align-middle">
          <span className="sr-only">Row actions</span>
        </th>
      </tr>
    </thead>
  );
}
