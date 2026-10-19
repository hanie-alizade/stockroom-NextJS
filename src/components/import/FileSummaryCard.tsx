import type { ReactElement } from "react";
import { CheckCircleIcon, CircleAlertIcon, FileIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/helpers";

export interface FileSummaryCardProps {
  fileName: string;
  rowCount: number;
  columnCount: number;
  sizeBytes: number;
  storeName: string;
  onReplaceFile: () => void;
  readyCount?: number;
  errorsCount?: number;
  showReviewBadges?: boolean;
  disabled?: boolean;
  className?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kb = Math.round(bytes / 1024);
  if (kb < 1024) {
    return `${kb} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileSummaryCard({
  fileName,
  rowCount,
  columnCount,
  sizeBytes,
  storeName,
  onReplaceFile,
  readyCount,
  errorsCount,
  showReviewBadges = false,
  disabled = false,
  className,
}: FileSummaryCardProps): ReactElement {
  const sizeText = formatFileSize(sizeBytes);
  const metaText = `${rowCount} rows · ${columnCount} columns · ${sizeText} · into ${storeName}`;

  return (
    <div
      className={cn(
        "h-[70px] w-full rounded-lg border border-border-default bg-bg-surface px-lg",
        "flex items-center justify-between gap-4",
        className,
      )}
    >
      {/* Left: icon and file meta */}
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent-subtle text-accent-default">
          <FileIcon className="size-4 shrink-0" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-body-strong text-text-primary truncate" title={fileName}>
            {fileName}
          </span>
          <span className="text-body-small text-text-tertiary truncate">
            {metaText}
          </span>
        </div>
      </div>

      {/* Right: optional badges and replace button */}
      <div className="flex shrink-0 items-center">
        {showReviewBadges && (
          <div className="flex items-center gap-2 mr-4">
            {readyCount !== undefined && (
              <span className="inline-flex h-[22px] items-center gap-xs rounded-full bg-status-ok-bg px-sm text-label font-medium text-status-ok-fg">
                <CheckCircleIcon className="size-3.5 shrink-0" />
                <span>{readyCount} ready</span>
              </span>
            )}
            {errorsCount !== undefined && errorsCount > 0 && (
              <span className="inline-flex h-[22px] items-center gap-xs rounded-full bg-status-danger-bg px-sm text-label font-medium text-status-danger-fg">
                <CircleAlertIcon className="size-3.5 shrink-0" />
                <span>{errorsCount} with errors</span>
              </span>
            )}
          </div>
        )}

        <Button
          type="button"
          variant="secondary"
          disabled={disabled}
          onClick={onReplaceFile}
          className="h-9"
        >
          Replace file
        </Button>
      </div>
    </div>
  );
}
