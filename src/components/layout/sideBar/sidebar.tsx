import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Brand } from "./brand";
import { Navigation } from "./navigation";
import { StoreSelector } from "./storeSelector";
import { UserProfileCard } from "./userProfileCard";

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

export function Sidebar(): React.ReactElement {
  return (
    <aside className="border-border-default bg-bg-surface flex h-screen w-[248px] flex-col border-r px-[12px] py-[20px]">
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
