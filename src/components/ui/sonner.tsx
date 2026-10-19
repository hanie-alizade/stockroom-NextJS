"use client";

import { CheckIcon, InfoIcon, CircleAlertIcon, WarningIcon } from "@/components/icons";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps): React.ReactElement => {
  return (
    <Sonner
      theme="light"
      visibleToasts={1}
      duration={5000}
      closeButton
      offset="24px"
      position="bottom-right"
      className="toaster group"
      icons={{
        success: <CheckIcon className="h-4 w-4 text-status-ok-fg" />,
        info: <InfoIcon className="h-4 w-4 text-text-tertiary" />,
        warning: <WarningIcon className="h-4 w-4 text-status-warn-fg" />,
        error: <CircleAlertIcon className="h-4 w-4 text-status-danger-fg" />,
        loading: (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ),
      }}
      toastOptions={{
        classNames: {
          toast: "border border-border-default bg-bg-surface text-text-primary rounded-md shadow-card",
          title: "text-label text-text-primary",
          description: "text-caption text-text-secondary",
          closeButton: "text-text-tertiary hover:text-text-primary border-border-default bg-bg-surface",
        },
      }}
      style={
        {
          "--width": "360px",
          "--normal-bg": "var(--bg-surface)",
          "--normal-text": "var(--text-primary)",
          "--normal-border": "var(--border-default)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
