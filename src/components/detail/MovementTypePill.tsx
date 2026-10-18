import type { ReactElement } from "react";
import { MOVEMENT_TYPE, MOVEMENT_TYPE_LABEL } from "@/constants";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CloseIcon,
  TransferIcon,
  UploadIcon,
} from "@/components/icons";
import { cn } from "@/helpers";
import type { MovementType } from "@/types";

export interface MovementTypePillProps {
  type: MovementType;
  className?: string;
}

export function MovementTypePill({ type, className }: MovementTypePillProps): ReactElement {
  let icon = <ArrowDownIcon className="size-3.5 shrink-0" />;
  let colorClass = "bg-status-info-bg text-status-info-fg";

  if (type === MOVEMENT_TYPE.SELL) {
    icon = <ArrowUpIcon className="size-3.5 shrink-0" />;
    colorClass = "bg-bg-muted text-text-secondary";
  } else if (type === MOVEMENT_TYPE.WRITE_OFF) {
    icon = <CloseIcon className="size-3.5 shrink-0" />;
    colorClass = "bg-status-danger-bg text-status-danger-fg";
  } else if (type === MOVEMENT_TYPE.TRANSFER_OUT || type === MOVEMENT_TYPE.TRANSFER_IN) {
    icon = <TransferIcon className="size-3.5 shrink-0" />;
    colorClass = "bg-status-transfer-bg text-status-transfer-fg";
  } else if (type === MOVEMENT_TYPE.IMPORT) {
    icon = <UploadIcon className="size-3.5 shrink-0" />;
    colorClass = "bg-status-ok-bg text-status-ok-fg";
  }

  const label = MOVEMENT_TYPE_LABEL[type];

  return (
    <span
      className={cn(
        "text-label inline-flex h-[22px] items-center gap-xs rounded-full px-sm whitespace-nowrap",
        colorClass,
        className,
      )}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
}
