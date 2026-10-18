import type { ReactNode } from "react";
import type { IconComponent } from "@/components/icons";
import { cn } from "@/helpers";

export interface StateBlockProps {
  icon: IconComponent;
  iconVariant?: "danger" | "neutral";
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionElement?: ReactNode;
  className?: string;
}

export function StateBlock({
  icon: Icon,
  iconVariant = "neutral",
  title,
  description,
  actionText,
  onAction,
  actionElement,
  className,
}: StateBlockProps): React.ReactElement {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div
        className={cn(
          "flex size-12 items-center justify-center rounded-full",
          iconVariant === "danger"
            ? "bg-status-danger-bg text-status-danger-fg"
            : "bg-bg-muted text-text-tertiary",
        )}
      >
        <Icon className="size-5" />
      </div>

      <h3 className="text-body-strong text-text-primary mt-3">{title}</h3>
      <p className="text-body-small text-text-secondary mt-1 max-w-[360px]">{description}</p>

      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="border-border-default bg-bg-surface hover:bg-bg-subtle text-text-primary text-label mt-4 inline-flex h-9 cursor-pointer items-center justify-center rounded-md border px-3 transition-colors"
        >
          {actionText}
        </button>
      )}

      {actionElement && <div className="mt-4">{actionElement}</div>}
    </div>
  );
}
