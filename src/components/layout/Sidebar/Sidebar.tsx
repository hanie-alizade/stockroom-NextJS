import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/helpers";
import { Brand } from "./Brand";
import { Navigation } from "./Navigation";
import { StoreSelector } from "./StoreSelector";
import { UserProfileCard } from "./UserProfileCard";

export interface SidebarProps {
  className?: string;
}

function SidebarContent(): React.ReactElement {
  return (
    <>
      <Brand />
      <StoreSelector />
      <Navigation />
      <div className="mt-auto">
        <UserProfileCard />
      </div>
    </>
  );
}

export function Sidebar({ className }: SidebarProps = {}): React.ReactElement {
  return (
    <aside
      className={cn(
        "border-border-default bg-bg-surface flex h-full w-[248px] flex-col border-r px-[12px] py-[20px]",
        className,
      )}
    >
      <Suspense
        fallback={
          <>
            <Brand />
            <div className="mb-4">
              <Skeleton className="h-8 w-full" />
            </div>
            <div className="flex flex-col gap-1">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
            <div className="mt-auto">
              <Skeleton className="h-12 w-full" />
            </div>
          </>
        }
      >
        <SidebarContent />
      </Suspense>
    </aside>
  );
}
