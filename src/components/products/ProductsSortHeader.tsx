import { DEFAULT_SORT_DIRECTION, SORT_DIRECTION } from "@/constants";
import { cn } from "@/helpers";
import { ArrowDownIcon, ArrowUpIcon, SortIcon } from "@/components/icons";
import type { ProductSortKey, SortDirection } from "@/types";

interface ProductsSortHeaderProps {
  column: ProductSortKey;
  label: string;
  currentSort?: ProductSortKey;
  currentDir?: SortDirection;
  onSort?: (column: ProductSortKey) => void;
  align?: "left" | "right";
  className?: string;
  hideInactiveIcon?: boolean;
}

export function ProductsSortHeader({
  column,
  label,
  currentSort,
  currentDir = DEFAULT_SORT_DIRECTION,
  onSort,
  align = "left",
  className,
  hideInactiveIcon = false,
}: ProductsSortHeaderProps): React.ReactElement {
  const isActive = currentSort === column;
  let ariaSort: "descending" | "ascending" | undefined;
  if (isActive) {
    ariaSort = currentDir === SORT_DIRECTION.DESC ? "descending" : "ascending";
  }

  let sortIcon: React.ReactNode = null;
  if (isActive) {
    sortIcon =
      currentDir === SORT_DIRECTION.DESC ? (
        <ArrowDownIcon className="text-text-primary size-3.5 shrink-0" />
      ) : (
        <ArrowUpIcon className="text-text-primary size-3.5 shrink-0" />
      );
  } else if (!hideInactiveIcon) {
    sortIcon = <SortIcon className="text-text-tertiary size-3.5 shrink-0" />;
  }

  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={cn(
        "px-md h-10 select-none text-left align-middle",
        align === "right" && "text-right",
        className,
      )}
    >
      {onSort ? (
        <button
          type="button"
          onClick={() => onSort(column)}
          className={cn(
            "text-label inline-flex items-center gap-xs transition-colors focus:outline-none",
            isActive
              ? "text-text-primary"
              : "text-text-secondary hover:text-text-primary",
            align === "right" && "ml-auto justify-end",
          )}
        >
          <span>{label}</span>
          {sortIcon}
        </button>
      ) : (
        <span
          className={cn(
            "text-label inline-flex items-center gap-xs",
            isActive ? "text-text-primary" : "text-text-secondary",
            align === "right" && "ml-auto justify-end",
          )}
        >
          <span>{label}</span>
          {sortIcon}
        </span>
      )}
    </th>
  );
}
