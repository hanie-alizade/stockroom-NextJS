import { DEFAULT_SORT_DIRECTION, SORT_DIRECTION } from "@/constants";
import { cn } from "@/helpers";
import { ArrowDownIcon, ArrowUpIcon, SortIcon } from "@/components/icons";
import type { ProductSortKey, SortDirection } from "@/types";

interface ProductsSortHeaderProps {
  column: ProductSortKey;
  label: string;
  currentSort?: ProductSortKey;
  currentDir?: SortDirection;
  onSort: (column: ProductSortKey) => void;
  align?: "left" | "right";
  className?: string;
}

export function ProductsSortHeader({
  column,
  label,
  currentSort,
  currentDir = DEFAULT_SORT_DIRECTION,
  onSort,
  align = "left",
  className,
}: ProductsSortHeaderProps): React.ReactElement {
  const isActive = currentSort === column;
  const ariaSort = isActive
    ? currentDir === SORT_DIRECTION.DESC
      ? "descending"
      : "ascending"
    : undefined;

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
        {isActive ? (
          currentDir === SORT_DIRECTION.DESC ? (
            <ArrowDownIcon className="text-text-primary size-3.5 shrink-0" />
          ) : (
            <ArrowUpIcon className="text-text-primary size-3.5 shrink-0" />
          )
        ) : (
          <SortIcon className="text-text-tertiary size-3.5 shrink-0" />
        )}
      </button>
    </th>
  );
}
