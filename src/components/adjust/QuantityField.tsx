"use client";

import type { ReactElement } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/helpers";

export interface QuantityFieldProps {
  value: string;
  error?: string | null;
  touched?: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function QuantityField({
  value,
  error,
  touched = false,
  disabled = false,
  onChange,
  onBlur,
  onKeyDown,
}: QuantityFieldProps): ReactElement {
  const hasError = Boolean(touched && error);

  return (
    <div className="flex flex-col gap-xs">
      <label htmlFor="adjust-quantity" className="text-label text-text-primary">
        Quantity
      </label>

      <Input
        id="adjust-quantity"
        type="text"
        inputMode="numeric"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        aria-invalid={hasError ? "true" : undefined}
        aria-describedby={hasError ? "adjust-quantity-error" : "adjust-quantity-helper"}
        className={cn(
          "h-10 w-full rounded-md border border-border-default bg-bg-surface px-md text-body focus:focus-ring focus-visible:outline-none",
          hasError && "border-status-danger-solid focus:border-status-danger-solid focus:ring-0",
        )}
      />

      {hasError ? (
        <span
          id="adjust-quantity-error"
          aria-live="polite"
          className="text-caption text-status-danger-fg"
        >
          {error}
        </span>
      ) : (
        <span id="adjust-quantity-helper" className="text-caption text-text-tertiary">
          Whole units only.
        </span>
      )}
    </div>
  );
}
