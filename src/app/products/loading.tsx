import type { ReactElement } from "react";
import { ALL_STORES } from "@/constants";
import {
  ProductsSummary,
  ProductsTableHead,
  ProductsTableSkeleton,
} from "@/components/products";
import { PageContainer } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductsLoading(): ReactElement {
  return (
    <PageContainer>
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-page-title text-text-primary">Products</h1>
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="gap-md flex items-center">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      <ProductsSummary
        summary={{
          totalProducts: 0,
          stockValueSen: 0,
          lowStock: 0,
          outOfStock: 0,
        }}
        store={ALL_STORES}
        isLoading={true}
      />

      <div className="gap-md flex items-center justify-between">
        <Skeleton className="h-10 w-72 rounded-md" />
        <div className="gap-md flex items-center">
          <Skeleton className="h-10 w-36 rounded-md" />
          <Skeleton className="h-10 w-36 rounded-md" />
        </div>
      </div>

      <div className="bg-bg-surface border-border-default shadow-card rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <ProductsTableHead
              onSort={() => {}}
              isAllSelected={false}
              isPartiallySelected={false}
              onToggleAll={() => {}}
            />
            <tbody>
              <ProductsTableSkeleton />
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
}
