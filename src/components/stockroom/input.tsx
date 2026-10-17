import { cn } from "@/lib/utils";
import { Input as ShadcnInput } from "@/components/ui/input";
import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  leadingIcon?: ReactNode;
  error?: string;
}

export function Input({
  label,
  leadingIcon,
  error,
  className,
  id,
  ...props
}: InputProps): React.ReactElement {
  const inputId = id;
  const errorId = inputId ? `${inputId}-error` : undefined;

  return (
    <div className="gap-xs flex flex-col">
      {label && (
        <label htmlFor={inputId} className="text-label text-text-primary">
          {label}
        </label>
      )}
      <div className="relative">
        {leadingIcon && (
          <div className="left-md text-text-tertiary absolute top-1/2 -translate-y-1/2">
            {leadingIcon}
          </div>
        )}
        <ShadcnInput
          id={inputId}
          className={cn(
            "focus-ring",
            leadingIcon && "pl-xl",
            error && "border-status-danger-border",
            className,
          )}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
      </div>
      {error && errorId && (
        <p id={errorId} className="text-caption text-status-danger-fg">
          {error}
        </p>
      )}
    </div>
  );
}
