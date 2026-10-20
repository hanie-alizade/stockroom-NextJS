import type { ReactElement, ReactNode } from "react";
import { cn } from "@/helpers";

export interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps): ReactElement {
  return (
    <div
      className={cn(
        "bg-bg-canvas flex min-h-screen w-full min-w-0 max-w-full flex-col gap-2xl p-lg sm:p-2xl lg:p-3xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
