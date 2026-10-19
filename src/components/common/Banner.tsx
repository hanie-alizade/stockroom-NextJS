import type { ReactNode } from "react";
import { CircleAlertIcon, InfoIcon, WarningIcon, CloseIcon } from "@/components/icons";
import { cn } from "@/helpers";

export interface BannerProps {
  variant?: "danger" | "warn" | "info";
  title?: string;
  description: ReactNode;
  actionText?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function Banner({
  variant = "danger",
  title,
  description,
  actionText,
  onAction,
  onDismiss,
  className,
}: BannerProps): React.ReactElement {
  let icon = <InfoIcon className="text-status-info-fg size-4 shrink-0" />;
  if (variant === "danger") {
    icon = <CircleAlertIcon className="text-status-danger-fg size-4 shrink-0" />;
  } else if (variant === "warn") {
    icon = <WarningIcon className="text-status-warn-fg size-4 shrink-0" />;
  }

  return (
    <div
      role="alert"
      className={cn(
        "flex min-h-[62px] items-center justify-between rounded-lg border px-4 py-3",
        variant === "danger" &&
          "border-status-danger-border bg-status-danger-bg text-status-danger-fg",
        variant === "warn" && "border-status-warn-border bg-status-warn-bg text-status-warn-fg",
        variant === "info" && "border-border-default bg-bg-surface text-text-primary",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div className="flex flex-col">
          {title && <span className="text-label font-semibold">{title}</span>}
          <span className="text-body-small">{description}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {actionText && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="text-label cursor-pointer font-medium hover:underline"
          >
            {actionText}
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss notice"
            className="text-text-tertiary hover:text-text-primary cursor-pointer p-1"
          >
            <CloseIcon className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
