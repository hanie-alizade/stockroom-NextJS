"use client";

import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/common";
import { cn, formatMoney, formatWhen } from "@/helpers";
import type { ProductListItem } from "@/types";

interface ProductsTableRowProps {
  item: ProductListItem;
  isSelected: boolean;
  storeParam: string;
  now: Date;
  onSelect: (item: ProductListItem) => void;
  onRowClick: (id: string) => void;
  onAdjust?: (item: ProductListItem) => void;
}

export function ProductsTableRow({
  item,
  isSelected,
  storeParam,
  now,
  onSelect,
  onRowClick,
  onAdjust,
}: ProductsTableRowProps): React.ReactElement {
  return (
    <tr
      onClick={() => onRowClick(item.id)}
      className={cn(
        "group border-border-default h-[52px] cursor-pointer border-b transition-colors",
        isSelected ? "bg-accent-subtle" : "hover:bg-bg-subtle",
      )}
    >
      <td
        className={cn(
          "w-[44px] min-w-[44px] max-w-[44px] px-md text-center align-middle sticky left-0 z-10",
          isSelected ? "bg-accent-subtle" : "bg-bg-surface group-hover:bg-bg-subtle",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="inline-flex items-center">
          <Checkbox
            aria-label={`Select ${item.name}`}
            checked={isSelected}
            onCheckedChange={() => onSelect(item)}
          />
        </div>
      </td>

      <td
        className={cn(
          "text-mono text-text-secondary w-[100px] min-w-[100px] max-w-[100px] px-md align-middle whitespace-nowrap sticky left-[44px] z-10",
          isSelected ? "bg-accent-subtle" : "bg-bg-surface group-hover:bg-bg-subtle",
        )}
      >
        {item.sku}
      </td>

      <td
        className={cn(
          "w-[220px] min-w-[220px] max-w-[220px] px-md align-middle sticky left-[144px] z-10 border-r border-border-default shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]",
          isSelected ? "bg-accent-subtle" : "bg-bg-surface group-hover:bg-bg-subtle",
        )}
      >
        <div className="flex flex-col">
          <Link
            href={`/products/${item.id}${storeParam}`}
            onClick={(e) => e.stopPropagation()}
            className="text-body-strong text-text-primary hover:underline"
          >
            {item.name}
          </Link>
          {item.supplier && (
            <span className="text-caption text-text-tertiary">
              {item.supplier}
            </span>
          )}
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

      <td suppressHydrationWarning className="text-body-small text-text-secondary px-md align-middle whitespace-nowrap">
        {formatWhen(item.updatedAt, now)}
      </td>

      <td
        className="w-[44px] pr-md text-right align-middle"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Actions for ${item.name}`}
              className="text-text-tertiary hover:text-text-primary inline-flex size-8 items-center justify-center rounded-md text-body-small transition-colors focus-visible:outline-none focus:focus-ring"
            >
              ···
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onAdjust?.(item);
              }}
            >
              Adjust stock
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
