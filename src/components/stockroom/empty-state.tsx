import { cn } from "@/lib/utils";
import { Button } from "./button";
import { SearchIcon, PackageIcon, CircleAlertIcon } from "@/components/icons";

export type EmptyStateVariant = "no-results" | "no-products" | "error";

interface EmptyStateProps {
  variant: EmptyStateVariant;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  variant,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps): React.ReactElement {
  const config = {
    "no-results": {
      icon: <SearchIcon className="text-text-tertiary h-12 w-12" />,
    },
    "no-products": {
      icon: <PackageIcon className="text-text-tertiary h-12 w-12" />,
    },
    error: {
      icon: <CircleAlertIcon className="text-status-danger-fg h-12 w-12" />,
    },
  }[variant];

  return (
    <div className="py-3xl flex flex-col items-center justify-center text-center">
      <div className="mb-lg">{config.icon}</div>
      <h3 className="text-section text-text-primary mb-sm">{title}</h3>
      <p className="text-body text-text-secondary mb-lg max-w-md">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
