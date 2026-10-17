"use client";

import { CheckIcon, InfoIcon, CircleAlertIcon, WarningIcon } from "@/components/icons";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps): React.ReactElement => {
  return (
    <Sonner
      theme={"light"}
      className="toaster group"
      icons={{
        success: <CheckIcon className="h-4 w-4" />,
        info: <InfoIcon className="h-4 w-4" />,
        warning: <WarningIcon className="h-4 w-4" />,
        error: <CircleAlertIcon className="h-4 w-4" />,
        loading: (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
