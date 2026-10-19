"use client";

import { useCallback, type ReactElement } from "react";
import {
  ALL_STORES,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  DETAIL_TAB,
  PERIOD,
} from "@/constants";
import type { DetailTab } from "@/constants";
import { useQueryMeta, useQueryProductDetail, useQueryProductMovements } from "@/apiHooks";
import { useProductDetailUrlState } from "@/hooks";
import { Banner, QueryErrorState } from "@/components/common";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/helpers";
import { ProductDetailHeader } from "./ProductDetailHeader";
import { StockChart } from "./StockChart";
import { ProductDetailsCard } from "./ProductDetailsCard";
import { StockByStoreTable } from "./StockByStoreTable";
import { MovementsTab } from "./MovementsTab";

export interface ProductDetailViewProps {
  productId: string;
}

export function ProductDetailView({ productId }: ProductDetailViewProps): ReactElement {
  const {
    query,
    setStore,
    setTab,
    setType,
    setPeriod,
    clearFilters,
    setPage,
    setPageSize,
  } = useProductDetailUrlState();

  const {
    data: product,
    isLoading,
    isError,
    error,
    refetch,
  } = useQueryProductDetail(productId, { store: query.store, fail: query.fail });

  const { data: defaultMovements } = useQueryProductMovements(productId, {
    store: query.store,
    period: PERIOD.DAYS_30,
    page: DEFAULT_PAGE,
    pageSize: DEFAULT_PAGE_SIZE,
    fail: query.fail,
  });

  const { data: meta } = useQueryMeta();
  const stores = meta?.stores ?? [];
  const currentStoreObj = stores.find((s) => s.id === query.store);
  const storeName = currentStoreObj?.name;

  const tabCount = defaultMovements?.total;

  const handleAdjust = useCallback((_storeId?: string) => {
    // TODO(hanie): open the Adjust stock dialog (next task)
  }, []);

  if (!product) {
    if (isError) {
      return (
        <QueryErrorState
          error={error}
          onRetry={() => void refetch()}
          hasData={false}
          variant="page"
        />
      );
    }

    return (
      <div className="bg-bg-canvas flex flex-col gap-lg p-3xl min-h-screen animate-pulse">
        <div className="h-4 w-48 bg-bg-muted rounded" />
        <div className="h-14 w-72 bg-bg-muted rounded" />
      </div>
    );
  }

  const isMovementsTabActive = query.tab === DETAIL_TAB.MOVEMENTS;

  return (
    <div className="bg-bg-canvas flex flex-col gap-lg p-3xl min-h-screen">
      {isError && (
        <QueryErrorState
          error={error}
          onRetry={() => void refetch()}
          hasData={true}
        />
      )}

      <ProductDetailHeader
        name={product.name}
        sku={product.sku}
        category={product.category}
        supplier={product.supplier}
        unitCostSen={product.unitCostSen}
        status={product.status}
        store={query.store}
        stockByStore={product.stockByStore}
        onAdjust={handleAdjust}
      />

      {query.store !== ALL_STORES && product.stockByStore.length === 0 && (
        <Banner
          variant="info"
          description={`This product is not carried at ${storeName ?? query.store}`}
          actionText="View in all stores"
          onAction={() => setStore(ALL_STORES)}
          className="min-h-0 py-2.5"
        />
      )}

      <Tabs
        value={query.tab}
        onValueChange={(val) => setTab(val as DetailTab)}
        className="w-full flex-col gap-0"
      >
        <TabsList
          variant="line"
          className="border-border-default h-10 w-full justify-start gap-2xl rounded-none border-b p-0"
        >
          <TabsTrigger
            value={DETAIL_TAB.OVERVIEW}
            className="text-body-strong data-[state=active]:text-text-primary text-text-tertiary hover:text-text-secondary data-[state=active]:after:bg-accent-default rounded-none border-b-0 px-0 after:bottom-[-1px] data-[state=active]:after:h-[2px]"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value={DETAIL_TAB.MOVEMENTS}
            className="text-body-strong data-[state=active]:text-text-primary text-text-tertiary hover:text-text-secondary data-[state=active]:after:bg-accent-default gap-sm rounded-none border-b-0 px-0 after:bottom-[-1px] data-[state=active]:after:h-[2px]"
          >
            <span>Movements</span>
            {tabCount !== undefined && (
              <span
                className={cn(
                  "text-caption inline-flex h-[18px] min-w-[28px] items-center justify-center rounded-full px-[6px] font-normal",
                  isMovementsTabActive
                    ? "bg-accent-subtle text-accent-default"
                    : "bg-bg-muted text-text-tertiary",
                )}
              >
                {tabCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={DETAIL_TAB.OVERVIEW} className="pt-2xl outline-none">
          <div className="flex flex-col gap-2xl">
            <div className="grid grid-cols-1 gap-2xl lg:grid-cols-[minmax(0,1fr)_320px]">
              <StockChart
                productId={productId}
                store={query.store}
                storeName={storeName}
                reorderLevel={product.reorderLevel}
                fail={query.fail}
              />
              <ProductDetailsCard
                onHand={product.onHand}
                reorderLevel={product.reorderLevel}
                unitCostSen={product.unitCostSen}
                stockValueSen={product.stockValueSen}
                supplier={product.supplier}
                lastMovementAt={product.lastMovementAt}
                store={query.store}
              />
            </div>

            <StockByStoreTable
              stockByStore={product.stockByStore}
              stores={stores}
              onAdjust={handleAdjust}
            />
          </div>
        </TabsContent>

        <TabsContent value={DETAIL_TAB.MOVEMENTS} className="pt-xl outline-none">
          <MovementsTab
            productId={productId}
            store={query.store}
            type={query.type}
            period={query.period}
            page={query.page}
            pageSize={query.pageSize}
            fail={query.fail}
            stores={stores}
            onTypeChange={setType}
            onStoreChange={setStore}
            onPeriodChange={setPeriod}
            onClearFilters={clearFilters}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onAdjust={handleAdjust}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
