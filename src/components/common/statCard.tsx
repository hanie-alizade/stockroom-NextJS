import { cn } from "@/helpers";

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle: string;
  variant?: "default" | "warn" | "danger";
  className?: string;
}

export function StatCard({
  label,
  value,
  subtitle,
  variant = "default",
  className,
}: StatCardProps): React.ReactElement {
  return (
    <div
      className={cn(
        "border-border-default bg-bg-surface shadow-card flex h-[105px] flex-col justify-between rounded-lg border p-lg",
        className,
      )}
    >
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
    </div>
  );
}
