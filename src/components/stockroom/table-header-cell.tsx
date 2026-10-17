import { cn } from "@/lib/utils";
import { SortIcon, ArrowUpIcon, ArrowDownIcon } from "@/components/icons";

export type SortDirection = "none" | "asc" | "desc";

interface TableHeaderCellProps {
  label: string;
  sortable?: boolean;
  sortDirection?: SortDirection;
  numeric?: boolean;
  onSort?: () => void;
}

export function TableHeaderCell({
  label,
  sortable = false,
  sortDirection = "none",
  numeric = false,
  onSort,
}: TableHeaderCellProps): React.ReactElement {
  const getSortIcon = () => {
    if (sortDirection === "asc") return <ArrowUpIcon className="h-4 w-4" />;
    if (sortDirection === "desc") return <ArrowDownIcon className="h-4 w-4" />;
    return <SortIcon className="h-4 w-4" />;
  };

  const getAriaSort = () => {
    if (!sortable) return undefined;
    if (sortDirection === "asc") return "ascending";
    if (sortDirection === "desc") return "descending";
    return "none";
  };

  return (
    <th
      className={cn(
        "px-md text-label text-text-secondary h-[40px] font-medium",
        numeric ? "text-right" : "text-left",
        sortable && "hover:text-text-primary focus-ring cursor-pointer",
      )}
      aria-sort={getAriaSort()}
      onClick={sortable ? onSort : undefined}
    >
      <div className={cn("gap-xs flex items-center", numeric && "justify-end")}>
        {label}
        {sortable && <span className="text-text-tertiary">{getSortIcon()}</span>}
      </div>
    </th>
  );
}
