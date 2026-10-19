import type { ReactNode } from "react";
import { cn } from "@/helpers";

export interface StatCardProps {
  label: string;
  value: ReactNode;
  subtitle: string;
  variant?: "default" | "warn" | "danger";
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}

export function StatCard({
  label,
  value,
  subtitle,
  variant = "default",
  className,
  onClick,
  selected = false,
}: StatCardProps): React.ReactElement {
  const content = (
    <>
      <span className="text-body-small text-text-secondary">{label}</span>
      <span
        className={cn(
          "text-numeric-large",
          variant === "warn" && "text-status-warn-fg",
          variant === "danger" && "text-status-danger-fg",
          variant === "default" && "text-text-primary",
        )}
      >
        {value}
      </span>
      <span className="text-caption text-text-tertiary">{subtitle}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        className={cn(
          "border-border-default bg-bg-surface shadow-card hover:bg-bg-subtle focus-visible:ring-border-focus p-lg flex h-[105px] cursor-pointer flex-col justify-between rounded-lg border text-left transition-colors focus-visible:ring-2 focus-visible:outline-none",
          selected && "border-border-focus ring-border-focus ring-1",
          className,
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "border-border-default bg-bg-surface shadow-card p-lg flex h-[105px] flex-col justify-between rounded-lg border",
        className,
      )}
    >
      {content}
    </div>
  );
}
