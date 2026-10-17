import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "./button";
import { CircleAlertIcon, WarningIcon, InfoIcon } from "@/components/icons";

export type InlineAlertVariant = "error" | "warning" | "info";

interface InlineAlertProps {
  variant: InlineAlertVariant;
  title: string;
  children: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export function InlineAlert({
  variant,
  title,
  children,
  actionLabel,
  onAction,
}: InlineAlertProps): React.ReactElement {
  const config = {
    error: {
      className: "bg-status-danger-bg border-status-danger-border",
      icon: <CircleAlertIcon className="text-status-danger-fg h-4 w-4" />,
      titleClass: "text-status-danger-fg",
    },
    warning: {
      className: "bg-status-warn-bg border-status-warn-border",
      icon: <WarningIcon className="text-status-warn-fg h-4 w-4" />,
      titleClass: "text-status-warn-fg",
    },
    info: {
      className: "bg-status-info-bg border-border-default",
      icon: <InfoIcon className="text-status-info-fg h-4 w-4" />,
      titleClass: "text-status-info-fg",
    },
  }[variant];

  return (
    <Alert className={cn("w-full border", config.className)} role="alert">
      <div className="gap-sm flex items-start">
        <span className="mt-px">{config.icon}</span>
        <div className="flex-1">
          <AlertTitle className={cn("text-body-strong mb-xs", config.titleClass)}>
            {title}
          </AlertTitle>
          <AlertDescription className="text-body text-text-secondary">{children}</AlertDescription>
        </div>
        {actionLabel && onAction && (
          <Button variant="ghost" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </Alert>
  );
}
