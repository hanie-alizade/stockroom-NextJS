import type { ReactElement } from "react";
import { CheckCircleIcon, InfoIcon, MinusIcon } from "@/components/icons";
import { cn } from "@/helpers";

export type MappingStatus = "matched" | "manual" | "skipped";

export interface MappingStatusPillProps {
  status: MappingStatus;
  className?: string;
}

export function MappingStatusPill({
  status,
  className,
}: MappingStatusPillProps): ReactElement {
  if (status === "matched") {
    return (
      <span
        className={cn(
          "inline-flex h-[22px] items-center gap-xs rounded-full bg-status-ok-bg px-sm text-label font-medium text-status-ok-fg",
          className,
        )}
      >
        <CheckCircleIcon className="size-3.5 shrink-0" />
        <span>Matched</span>
      </span>
    );
  }

  if (status === "manual") {
    return (
      <span
        className={cn(
          "inline-flex h-[22px] items-center gap-xs rounded-full bg-status-info-bg px-sm text-label font-medium text-status-info-fg",
          className,
        )}
      >
        <InfoIcon className="size-3.5 shrink-0" />
        <span>Set by you</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-xs rounded-full bg-bg-muted px-sm text-label font-medium text-text-tertiary",
        className,
      )}
    >
      <MinusIcon className="size-3.5 shrink-0" />
      <span>Skipped</span>
    </span>
  );
}
