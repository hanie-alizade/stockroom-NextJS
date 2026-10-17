import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CloseIcon,
  TransferIcon,
  UploadIcon,
} from "@/components/icons";

export type MovementType =
  "receive" | "sell" | "write_off" | "transfer_in" | "transfer_out" | "import";

interface MovementTypePillProps {
  type: MovementType;
}

export function MovementTypePill({ type }: MovementTypePillProps): React.ReactElement {
  const config = {
    receive: {
      className: "bg-status-info-bg text-status-info-fg",
      icon: <ArrowDownIcon className="h-3 w-3" />,
      label: "Received",
    },
    sell: {
      className: "bg-bg-muted text-text-secondary",
      icon: <ArrowUpIcon className="h-3 w-3" />,
      label: "Sold",
    },
    write_off: {
      className: "bg-status-danger-bg text-status-danger-fg",
      icon: <CloseIcon className="h-3 w-3" />,
      label: "Write-off",
    },
    transfer_in: {
      className: "bg-status-transfer-bg text-status-transfer-fg",
      icon: <TransferIcon className="h-3 w-3" />,
      label: "Transfer in",
    },
    transfer_out: {
      className: "bg-status-transfer-bg text-status-transfer-fg",
      icon: <TransferIcon className="h-3 w-3" />,
      label: "Transfer out",
    },
    import: {
      className: "bg-status-ok-bg text-status-ok-fg",
      icon: <UploadIcon className="h-3 w-3" />,
      label: "Import",
    },
  }[type];

  return (
    <Badge
      variant="outline"
      className={cn(
        "px-md py-xs text-body-small rounded-full border font-medium",
        config.className,
      )}
    >
      <span className="mr-xs flex items-center">{config.icon}</span>
      {config.label}
    </Badge>
  );
}
