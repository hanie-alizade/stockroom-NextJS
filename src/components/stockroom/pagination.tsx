import { Button } from "./button";
import { Select } from "./select";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

const PAGE_SIZE_OPTIONS = [
  { value: "25", label: "25" },
  { value: "50", label: "50" },
  { value: "100", label: "100" },
];

interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function Pagination({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: PaginationProps): React.ReactElement {
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="gap-lg py-md flex items-center justify-between">
      <div className="gap-sm text-body-small text-text-secondary flex items-center">
        <span>Rows per page</span>
        <Select
          options={PAGE_SIZE_OPTIONS}
          value={String(pageSize)}
          onValueChange={(value) => onPageSizeChange(Number(value))}
          className="w-[70px]"
        />
      </div>

      <div className="gap-lg flex items-center">
        <span className="text-mono text-body-small text-text-secondary">
          {startItem}-{endItem} of {totalItems}
        </span>

        <div className="gap-xs flex items-center">
          <Button
            variant="ghost"
            iconOnly
            accessibleName="Previous page"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="ghost"
            iconOnly
            accessibleName="Next page"
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => onPageChange(currentPage + 1)}
          >
            <ChevronRightIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}
