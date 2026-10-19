"use client";

import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
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
}

export function ProductsTableRow({
  item,
  isSelected,
  storeParam,
  now,
  onSelect,
  onRowClick,
}: ProductsTableRowProps): React.ReactElement {
  return (
    <tr
      onClick={() => onRowClick(item.id)}
      className={cn(
        "border-border-default h-[52px] cursor-pointer border-b transition-colors",
        isSelected ? "bg-accent-subtle" : "hover:bg-bg-subtle",
      )}
    >
      <td className="px-md w-[44px] text-center align-middle" onClick={(e) => e.stopPropagation()}>
        <div className="inline-flex items-center">
          <Checkbox
            aria-label={`Select ${item.name}`}
            checked={isSelected}
            onCheckedChange={() => onSelect(item)}
          />
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
          <span className="text-caption text-text-tertiary">{item.supplier}</span>
        </div>
      </td>

      <td className="text-body text-text-secondary px-md align-middle whitespace-nowrap">
        {item.category}
      </td>

      <td className="px-md text-right align-middle whitespace-nowrap">
        <span
          className={cn(
            "text-mono-strong",
            item.onHand === 0 ? "text-status-danger-fg" : "text-text-primary",
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

      <td
        suppressHydrationWarning
        className="text-body-small text-text-secondary px-md align-middle whitespace-nowrap"
      >
        {formatWhen(item.updatedAt, now)}
      </td>

      <td className="pr-md w-[44px] text-right align-middle" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          aria-label="Row actions"
          className="text-text-tertiary hover:text-text-primary inline-flex size-8 items-center justify-center rounded-md text-sm transition-colors"
        >
          ···
        </button>
      </td>
    </tr>
  );
}
