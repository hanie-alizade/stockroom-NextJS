"use client";

import type { ReactElement } from "react";
import { SupplierIcon } from "@/components/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/helpers";

export interface StoreOption {
  storeId: string;
  storeName: string;
  onHand: number;
  reorderLevel: number;
}

export interface StoreSelectProps {
  id: string;
  label: string;
  value: string;
  stores: StoreOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: string | null;
  touched?: boolean;
  onChange: (value: string) => void;
  onBlur?: () => void;
  className?: string;
}

export function StoreSelect({
  id,
  label,
  value,
  stores,
  placeholder = "Select a store",
  disabled = false,
  error,
  touched = false,
  onChange,
  onBlur,
  className,
}: StoreSelectProps): ReactElement {
  const hasError = Boolean(touched && error);

  return (
    <div className={cn("flex flex-col gap-xs", className)}>
      <label htmlFor={id} className="text-label text-text-primary">
        {label}
      </label>

      <Select
        value={value || undefined}
        onValueChange={onChange}
        onOpenChange={(isOpen) => {
          if (!isOpen && onBlur) {
            onBlur();
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger
          id={id}
          aria-invalid={hasError ? "true" : undefined}
          aria-describedby={hasError ? `${id}-error` : undefined}
          onBlur={onBlur}
          className={cn(
            "h-10 w-full rounded-md border border-border-default bg-bg-surface px-md text-body focus-visible:ring-border-focus focus-visible:ring-2 focus-visible:outline-none",
            hasError && "border-status-danger-solid focus-visible:ring-status-danger-solid",
            "[&>svg:last-child]:text-text-tertiary [&>svg:last-child]:opacity-100",
          )}
        >
          <div className="flex min-w-0 items-center gap-xs overflow-hidden">
            <SupplierIcon className="size-4 shrink-0 text-text-tertiary" />
            <SelectValue
              placeholder={<span className="text-text-tertiary">{placeholder}</span>}
            />
          </div>
        </SelectTrigger>

        <SelectContent className="bg-bg-surface border-border-default shadow-popover">
          {stores.map((s) => (
            <SelectItem
              key={s.storeId}
              value={s.storeId}
              className="hover:bg-bg-subtle focus:bg-bg-subtle cursor-pointer text-body"
            >
              {s.storeName} · {s.onHand} on hand
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="min-h-[18px]">
        {hasError && (
          <span
            id={`${id}-error`}
            aria-live="polite"
            className="text-caption text-status-danger-fg block"
          >
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
