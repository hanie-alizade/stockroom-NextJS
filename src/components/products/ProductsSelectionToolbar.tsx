"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { DownloadIcon } from "@/components/icons";

export interface ProductsSelectionToolbarProps {
  selectedCount: number;
  isAllPageSelected: boolean;
  onTogglePage: () => void;
  onExport: () => void;
  onClearSelection: () => void;
}

export function ProductsSelectionToolbar({
  selectedCount,
  isAllPageSelected,
  onTogglePage,
  onExport,
  onClearSelection,
}: ProductsSelectionToolbarProps): React.ReactElement {
  return (
    <div className="bg-accent-subtle flex min-h-[60px] md:h-[60px] flex-wrap md:flex-nowrap items-center justify-between gap-2 py-2 md:py-0 px-4">
      <div className="flex items-center gap-2 min-h-11 md:min-h-0">
        <Checkbox
          checked={isAllPageSelected ? true : "indeterminate"}
          onCheckedChange={onTogglePage}
          aria-label="Select all rows on current page"
        />
        <span className="text-label text-text-primary font-semibold">
          {selectedCount} selected
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onExport}
          className="border-border-default bg-bg-surface hover:bg-bg-subtle text-text-primary text-label inline-flex min-h-11 md:min-h-9 md:h-9 cursor-pointer items-center justify-center gap-2 rounded-md border px-3 transition-colors"
        >
          <DownloadIcon className="size-4 shrink-0" />
          <span>Export selected</span>
        </button>

        <button
          type="button"
          onClick={onClearSelection}
          className="text-text-secondary hover:text-text-primary text-label cursor-pointer min-h-11 md:min-h-0 inline-flex items-center px-2 py-1 transition-colors"
        >
          Clear selection
        </button>
      </div>
    </div>
  );
}
