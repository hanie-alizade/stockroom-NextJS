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
import { cn, formatMoney } from "@/helpers";
import type { ProductListItem } from "@/types";

export interface ProductCardProps {
  item: ProductListItem;
  isSelected: boolean;
  storeParam: string;
  onSelect: (item: ProductListItem) => void;
  onClick: (id: string) => void;
  onAdjust?: (item: ProductListItem) => void;
}

export function ProductCard({
  item,
  isSelected,
  storeParam,
  onSelect,
  onClick,
  onAdjust,
}: ProductCardProps): React.ReactElement {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(item.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(item.id);
        }
      }}
      className={cn(
        "border-border-default bg-bg-surface flex flex-col gap-3 rounded-lg border p-4 cursor-pointer transition-colors",
        isSelected ? "bg-accent-subtle" : "hover:bg-bg-subtle",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="pt-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              aria-label={`Select ${item.name}`}
              checked={isSelected}
              onCheckedChange={() => onSelect(item)}
            />
          </div>
          <div className="flex flex-col min-w-0">
            <Link
              href={`/products/${item.id}${storeParam}`}
              onClick={(e) => e.stopPropagation()}
              className="text-body-strong text-text-primary hover:underline truncate"
            >
              {item.name}
            </Link>
            <span className="text-mono text-caption text-text-secondary mt-0.5">
              {item.sku}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge status={item.status} />
          <div onClick={(e) => e.stopPropagation()}>
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
          </div>
        </div>
      </div>

      <div className="border-border-subtle grid grid-cols-3 gap-2 border-t pt-3 text-caption text-text-secondary">
        <div>
          <span className="block text-text-tertiary">On hand</span>
          <span
            className={cn(
              "text-mono-strong text-body",
              item.onHand === 0 ? "text-status-danger-fg" : "text-text-primary",
            )}
          >
            {item.onHand}
          </span>
        </div>
        <div>
          <span className="block text-text-tertiary">Reorder at</span>
          <span className="text-mono text-body text-text-primary">
            {item.reorderLevel}
          </span>
        </div>
        <div className="text-right">
          <span className="block text-text-tertiary">Unit cost</span>
          <span className="text-mono text-body text-text-primary">
            {formatMoney(item.unitCostSen, { withCurrency: true })}
          </span>
        </div>
      </div>
    </div>
  );
}
