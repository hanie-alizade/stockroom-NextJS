"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import type { PageSize } from "@/types";

import { PAGE_SIZE_OPTIONS } from "@/constants";

interface PaginationProps {
  page: number;
  pageSize: PageSize;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: PageSize) => void;
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: PaginationProps): React.ReactElement {
  const isFirstPage = page <= 1;
  const isLastPage = total === 0 || page * pageSize >= total;

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const rangeText = `${start}–${end} of ${total}`;

  return (
    <div className="border-border-default flex items-center justify-between border-t p-lg">
      <div className="flex items-center gap-2">
        <span className="text-body-small text-text-secondary">Rows per page</span>
        <Select
          value={String(pageSize)}
          onValueChange={(val) => onPageSizeChange(Number(val) as PageSize)}
        >
          <SelectTrigger className="h-8 w-[64px] px-2 text-center" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-md">
        <span className="text-mono text-body-small text-text-secondary">{rangeText}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous page"
            disabled={isFirstPage}
            onClick={() => onPageChange(page - 1)}
            className="border-border-default hover:bg-bg-subtle disabled:text-text-disabled text-text-primary flex size-8 items-center justify-center rounded-md border transition-colors disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <ChevronLeftIcon className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Next page"
            disabled={isLastPage}
            onClick={() => onPageChange(page + 1)}
            className="border-border-default hover:bg-bg-subtle disabled:text-text-disabled text-text-primary flex size-8 items-center justify-center rounded-md border transition-colors disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <ChevronRightIcon className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
