import { STOCK_STATUS, STOCK_STATUS_LABEL } from "@/constants";
import { cn } from "@/lib/utils";
import { CheckIcon, WarningIcon, CircleAlertIcon } from "@/components/icons";
import type { StockStatus } from "@/lib/types/product";

interface StatusBadgeProps {
  status: StockStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps): React.ReactElement {
  if (status === STOCK_STATUS.IN_STOCK) {
    return (
      <span
        className={cn(
          "bg-status-ok-bg text-status-ok-fg text-label inline-flex h-[22px] items-center gap-xs rounded-full px-sm whitespace-nowrap",
          className,
        )}
      >
        <CheckIcon className="size-3.5 shrink-0" />
        <span>{STOCK_STATUS_LABEL[STOCK_STATUS.IN_STOCK]}</span>
      </span>
    );
  }

  if (status === STOCK_STATUS.LOW) {
    return (
      <span
        className={cn(
          "bg-status-warn-bg text-status-warn-fg border-status-warn-border text-label inline-flex h-[22px] items-center gap-xs rounded-full border px-sm whitespace-nowrap",
          className,
        )}
      >
        <WarningIcon className="size-3.5 shrink-0" />
        <span>{STOCK_STATUS_LABEL[STOCK_STATUS.LOW]}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "bg-status-danger-bg text-status-danger-fg border-status-danger-border text-label inline-flex h-[22px] items-center gap-xs rounded-full border px-sm whitespace-nowrap",
        className,
      )}
    >
      <CircleAlertIcon className="size-3.5 shrink-0" />
      <span>{STOCK_STATUS_LABEL[STOCK_STATUS.OUT]}</span>
    </span>
  );
}
