import type { ReactElement } from "react";
import { CheckCircleIcon, CircleAlertIcon } from "@/components/icons";
import { cn } from "@/helpers";
import type { ImportValidationSummary } from "@/types";

export interface ReviewSummaryProps {
  summary: ImportValidationSummary;
  className?: string;
}

/**
 * Summary badge indicators and screen-reader announcement for validation results.
 */
export function ReviewSummary({ summary, className }: ReviewSummaryProps): ReactElement {
  const liveText = `${summary.total} rows checked: ${summary.valid} ready, ${summary.invalid} with errors`;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="sr-only" aria-live="polite" role="status">
        {liveText}
      </div>

      <span className="inline-flex h-[22px] items-center gap-xs rounded-full bg-status-ok-bg px-sm text-label font-medium text-status-ok-fg">
        <CheckCircleIcon className="size-3.5 shrink-0" />
        <span>{summary.valid} ready</span>
      </span>

      {summary.invalid > 0 && (
        <span className="inline-flex h-[22px] items-center gap-xs rounded-full bg-status-danger-bg px-sm text-label font-medium text-status-danger-fg">
          <CircleAlertIcon className="size-3.5 shrink-0" />
          <span>{summary.invalid} with errors</span>
        </span>
      )}
    </div>
  );
}
