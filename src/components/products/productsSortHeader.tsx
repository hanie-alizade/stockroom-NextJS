import { cn } from "@/lib/utils";
import { ArrowDownIcon, ArrowUpIcon, SortIcon } from "@/components/icons";
import type { ProductSortKey } from "@/lib/types/product";
import type { SortDirection } from "@/lib/types/common";

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
  currentDir = "desc",
  onSort,
  align = "left",
  className,
}: ProductsSortHeaderProps): React.ReactElement {
  const isActive = currentSort === column;
  const ariaSort = isActive
    ? currentDir === "desc"
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
          currentDir === "desc" ? (
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
