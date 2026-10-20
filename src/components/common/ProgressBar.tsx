import type { ReactElement } from "react";
import { cn } from "@/helpers";

export interface ProgressBarProps {
  className?: string;
}

export function ProgressBar({ className }: ProgressBarProps): ReactElement {
  return (
    <div
      role="progressbar"
      aria-label="Loading"
      className={cn("bg-bg-muted relative h-0.5 w-full overflow-hidden", className)}
    >
      <div className="bg-accent-default absolute top-0 bottom-0 left-0 w-1/3 animate-indeterminate-bar motion-reduce:animate-none motion-reduce:w-full" />
    </div>
  );
}
