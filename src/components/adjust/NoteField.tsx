"use client";

import type { ReactElement } from "react";
import { Input } from "@/components/ui/input";
import { cn, type AdjustmentType } from "@/helpers";
import { ADJUSTMENT_TYPE } from "@/constants";

export interface NoteFieldProps {
  type: AdjustmentType;
  value: string;
  error?: string | null;
  touched?: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function NoteField({
  type,
  value,
  error,
  touched = false,
  disabled = false,
  onChange,
  onBlur,
  onKeyDown,
}: NoteFieldProps): ReactElement {
  const isWriteOff = type === ADJUSTMENT_TYPE.WRITE_OFF;
  const hasError = Boolean(touched && error);

  const label = isWriteOff ? "Reason" : "Note";
  const hint = isWriteOff
    ? "Required · 3 to 200 characters"
    : "Optional · max 200 characters";

  return (
    <div className="flex flex-col gap-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <label htmlFor="adjust-note" className="text-label text-text-primary">
            {label}
          </label>
          <span className="ml-sm text-caption text-text-tertiary">{hint}</span>
        </div>
        <span
          className={cn(
            "text-caption text-text-tertiary",
            value.length > 200 && "text-status-danger-fg",
          )}
        >
          {value.length}/200
        </span>
      </div>

      <Input
        id="adjust-note"
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        aria-invalid={hasError ? "true" : undefined}
        aria-describedby={hasError ? "adjust-note-error" : undefined}
        className={cn(
          "h-10 w-full rounded-md border border-border-default bg-bg-surface px-md text-body focus:focus-ring focus-visible:outline-none",
          hasError && "border-status-danger-solid focus:border-status-danger-solid focus:ring-0",
        )}
      />

      {hasError && (
        <span
          id="adjust-note-error"
          aria-live="polite"
          className="text-caption text-status-danger-fg"
        >
          {error}
        </span>
      )}
    </div>
  );
}
