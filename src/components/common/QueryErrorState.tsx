import type { ReactElement } from "react";
import { CircleAlertIcon } from "@/components/icons";
import { cn, getErrorInfo } from "@/helpers";
import { Banner } from "./Banner";
import { StateBlock } from "./StateBlock";

export interface QueryErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  hasData?: boolean;
  variant?: "page" | "section" | "inline";
  title?: string;
  className?: string;
}

export function QueryErrorState({
  error,
  onRetry,
  hasData = false,
  variant = "page",
  title,
  className,
}: QueryErrorStateProps): ReactElement {
  const info = getErrorInfo(error);

  if (variant === "inline") {
    return (
      <div
        className={cn(
          "flex h-full flex-col items-center justify-center text-center",
          className,
        )}
      >
        <h3 className="text-body-strong text-text-primary">
          {title ?? "We couldn't load this chart"}
        </h3>
        <p className="text-body-small text-text-secondary mt-1">Your data is safe.</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="border-border-default bg-bg-surface hover:bg-bg-subtle text-text-primary text-label mt-3 inline-flex h-8 cursor-pointer items-center justify-center rounded-md border px-3"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  const bannerTitle = title ?? (info.kind === "network" ? info.title : "Something went wrong");

  let bannerDescription: string;
  if (info.kind === "network") {
    bannerDescription = "Unable to reach the server. Your data hasn't changed.";
  } else if (info.status !== undefined && info.status > 0) {
    bannerDescription = `The server returned an error (${info.status}). Your data hasn't changed.`;
  } else {
    bannerDescription = "The server returned an error. Your data hasn't changed.";
  }

  if (hasData) {
    return (
      <div className={className}>
        <Banner
          variant="danger"
          title={bannerTitle}
          description={bannerDescription}
          actionText={onRetry ? "Try again" : undefined}
          onAction={onRetry}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col p-4",
        variant === "page" && "min-h-[calc(100vh-64px)]",
        className,
      )}
    >
      <Banner
        variant="danger"
        title={bannerTitle}
        description={bannerDescription}
        actionText={onRetry ? "Try again" : undefined}
        onAction={onRetry}
      />
      <div className="mt-12 flex flex-1 items-center justify-center pb-12">
        <StateBlock
          icon={CircleAlertIcon}
          iconVariant="danger"
          title="Something went wrong"
          description="We couldn't load this page. Your data is safe."
          actionText={onRetry ? "Try again" : undefined}
          onAction={onRetry}
        />
      </div>
    </div>
  );
}
