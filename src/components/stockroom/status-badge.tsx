import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, CircleAlertIcon } from "@/components/icons";

export type StatusBadgeVariant = "in-stock" | "low" | "out-of-stock";

interface StatusBadgeProps {
  variant: StatusBadgeVariant;
}

export function StatusBadge({ variant }: StatusBadgeProps): React.ReactElement {
  const config = {
    "in-stock": {
      className: "bg-status-ok-bg text-status-ok-fg",
      icon: <CheckIcon className="h-3 w-3" />,
      label: "In stock",
    },
    low: {
      className: "bg-status-warn-bg text-status-warn-fg border-status-warn-border",
      icon: <CircleAlertIcon className="h-3 w-3" />,
      label: "Low",
    },
    "out-of-stock": {
      className: "bg-status-danger-bg text-status-danger-fg border-status-danger-border",
      icon: <CircleAlertIcon className="h-3 w-3" />,
      label: "Out of stock",
    },
  }[variant];

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
