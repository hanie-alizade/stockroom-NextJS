import { cn } from "@/helpers";
import type { ProductListItem } from "@/types";
import { ProductCard } from "./ProductCard";

export interface ProductCardListProps {
  items: ProductListItem[];
  isSelected: (id: string) => boolean;
  storeParam: string;
  onSelect: (item: ProductListItem) => void;
  onCardClick: (id: string) => void;
  onAdjust?: (item: ProductListItem) => void;
  className?: string;
}

export function ProductCardList({
  items,
  isSelected,
  storeParam,
  onSelect,
  onCardClick,
  onAdjust,
  className,
}: ProductCardListProps): React.ReactElement {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {items.map((item) => (
        <ProductCard
          key={item.id}
          item={item}
          isSelected={isSelected(item.id)}
          storeParam={storeParam}
          onSelect={onSelect}
          onClick={onCardClick}
          onAdjust={onAdjust}
        />
      ))}
    </div>
  );
}
