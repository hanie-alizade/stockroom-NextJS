import { cn } from "@/helpers";

function Skeleton({ className, ...props }: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-bg-muted animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };
