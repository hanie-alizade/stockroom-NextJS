import { STOCK_STATUS, STOCK_STATUS_LABEL } from "@/constants";
import { cn } from "@/helpers";
import { CheckIcon, WarningIcon, CircleAlertIcon } from "@/components/icons";
import type { IconComponent } from "@/components/icons";
import type { StockStatus } from "@/types";

interface StatusBadgeProps {
  status: StockStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  StockStatus,
  {
    icon: IconComponent;
    className: string;
  }
> = {
  [STOCK_STATUS.IN_STOCK]: {
    icon: CheckIcon,
    className: "bg-status-ok-bg text-status-ok-fg",
  },
  [STOCK_STATUS.LOW]: {
    icon: WarningIcon,
    className: "bg-status-warn-bg text-status-warn-fg border-status-warn-border border",
  },
  [STOCK_STATUS.OUT]: {
    icon: CircleAlertIcon,
    className: "bg-status-danger-bg text-status-danger-fg border-status-danger-border border",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps): React.ReactElement {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "text-label gap-xs px-sm inline-flex h-[22px] items-center rounded-full whitespace-nowrap",
        config.className,
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" />
      <span>{STOCK_STATUS_LABEL[status]}</span>
    </span>
  );
}
