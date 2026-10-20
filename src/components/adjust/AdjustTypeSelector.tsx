"use client";

import type { ReactElement } from "react";
import { ADJUSTMENT_PERMISSION, ADJUSTMENT_TYPE } from "@/constants";
import { LockIcon } from "@/components/icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { roleHasPermission } from "@/domain";
import { cn, type AdjustmentType } from "@/helpers";
import type { Role } from "@/types";

export interface AdjustTypeSelectorProps {
  type: AdjustmentType;
  role: Role;
  disabled?: boolean;
  onTypeChange: (type: AdjustmentType) => void;
  selectedRef?: React.RefObject<HTMLButtonElement | null>;
}

const TYPES: { value: AdjustmentType; label: string }[] = [
  { value: ADJUSTMENT_TYPE.RECEIVE, label: "Receive" },
  { value: ADJUSTMENT_TYPE.SELL, label: "Sell" },
  { value: ADJUSTMENT_TYPE.WRITE_OFF, label: "Write-off" },
  { value: ADJUSTMENT_TYPE.TRANSFER, label: "Transfer" },
];

export function AdjustTypeSelector({
  type,
  role,
  disabled = false,
  onTypeChange,
  selectedRef,
}: AdjustTypeSelectorProps): ReactElement {
  return (
    <div className="flex flex-col gap-xs">
      <label id="adjust-type-label" className="text-label text-text-primary">
        Type
      </label>

      <div
        role="radiogroup"
        aria-labelledby="adjust-type-label"
        className="bg-bg-muted grid h-10 w-full grid-cols-4 rounded-md p-1"
      >
        {TYPES.map(({ value: t, label }) => {
          const isSelected = type === t;
          const isAllowed = roleHasPermission(role, ADJUSTMENT_PERMISSION[t]);

          if (!isAllowed) {
            return (
              <TooltipProvider key={t} delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      aria-disabled="true"
                      tabIndex={0}
                      onClick={(e) => e.preventDefault()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                        }
                      }}
                      className={cn(
                        "text-text-disabled flex h-8 min-w-0 cursor-not-allowed items-center justify-center gap-xs rounded-md px-1 text-label select-none",
                      )}
                    >
                      <LockIcon className="size-3.5 shrink-0 text-text-disabled" />
                      <span className="truncate text-text-disabled">{label}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    align="end"
                    sideOffset={8}
                    hideArrow
                    className="bg-bg-overlay text-text-on-accent text-caption shadow-popover whitespace-nowrap rounded-md border-0 px-md py-sm"
                  >
                    Only managers can write off or transfer stock.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }

          return (
            <button
              key={t}
              ref={isSelected ? selectedRef : undefined}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => !disabled && onTypeChange(t)}
              className={cn(
                "flex h-8 min-w-0 cursor-pointer items-center justify-center rounded-md px-1 text-label transition-all select-none",
                isSelected && "bg-bg-surface text-text-primary shadow-card",
                !isSelected && !disabled && "text-text-secondary hover:text-text-primary",
                !isSelected && disabled && "text-text-disabled",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
