import type { ReactElement } from "react";
import { PageContainer } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { DETAIL_TAB } from "@/constants";
import type { DetailTab } from "@/constants";

export interface ProductDetailSkeletonProps {
  tab?: DetailTab;
}

export function ProductDetailSkeleton({
  tab = DETAIL_TAB.OVERVIEW,
}: ProductDetailSkeletonProps): ReactElement {
  return (
    <PageContainer>
      <div className="flex flex-col">
        <div className="pb-xs">
          <Skeleton className="h-4 w-44" />
        </div>
        <div className="flex h-14 items-center justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-md">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="flex items-center gap-sm">
              <Skeleton className="h-5 w-16 rounded-sm" />
              <Skeleton className="h-4 w-72" />
            </div>
          </div>
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      <div className="border-border-default flex gap-lg border-b pb-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-24" />
      </div>

      {tab === DETAIL_TAB.MOVEMENTS ? (
        <div className="flex flex-col gap-xl pt-xl">
          <div className="flex flex-wrap items-center gap-md">
            <Skeleton className="h-9 w-40 rounded-md" />
            <Skeleton className="h-9 w-40 rounded-md" />
            <Skeleton className="h-9 w-40 rounded-md" />
          </div>
          <div className="bg-bg-surface border-border-default shadow-card rounded-lg border p-6">
            <div className="flex flex-col gap-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2xl pt-2xl">
          <div className="grid grid-cols-1 gap-2xl lg:grid-cols-[minmax(0,1fr)_320px]">
            {/* Stock chart loading state */}
            <div className="bg-bg-surface border-border-default shadow-card flex flex-col gap-4 rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-8 w-32 rounded-md" />
              </div>
              <Skeleton className="h-[200px] w-full rounded-md" />
            </div>

            {/* Product details card loading state */}
            <div className="bg-bg-surface border-border-default shadow-card flex flex-col gap-4 rounded-lg border p-6">
              <Skeleton className="h-6 w-32" />
              <div className="flex flex-col gap-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>

          {/* Stock by store table loading state */}
          <div className="bg-bg-surface border-border-default shadow-card rounded-lg border p-6">
            <Skeleton className="mb-4 h-6 w-36" />
            <div className="flex flex-col gap-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
