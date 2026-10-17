import { cn } from "@/lib/utils";
import { Button as ShadcnButton } from "@/components/ui/button";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  isLoading?: boolean;
  iconOnly?: boolean;
  accessibleName?: string;
}

export function Button({
  variant = "primary",
  leadingIcon,
  trailingIcon,
  isLoading = false,
  iconOnly = false,
  accessibleName,
  disabled,
  className,
  children,
  ...props
}: ButtonProps): React.ReactElement {
  const getShadcnVariant = (): "default" | "secondary" | "ghost" | "destructive" => {
    switch (variant) {
      case "primary":
        return "default";
      case "secondary":
        return "secondary";
      case "ghost":
        return "ghost";
      case "danger":
        return "destructive";
    }
  };

  return (
    <ShadcnButton
      variant={getShadcnVariant()}
      disabled={disabled || isLoading}
      className={cn("focus-ring", className)}
      aria-label={iconOnly ? accessibleName : undefined}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span className="ml-sm">Saving...</span>
        </>
      ) : (
        <>
          {leadingIcon && <span className="mr-sm">{leadingIcon}</span>}
          {children}
          {trailingIcon && <span className="ml-sm">{trailingIcon}</span>}
        </>
      )}
    </ShadcnButton>
  );
}
