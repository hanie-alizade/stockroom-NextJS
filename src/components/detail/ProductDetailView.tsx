"use client";

import { useCallback, useMemo, useRef, useState, type ReactElement } from "react";
import { ALL_STORES, DEFAULT_PAGE, DEFAULT_PAGE_SIZE, DETAIL_TAB, PERIOD, type DetailTab } from "@/constants";
import { useMutationAdjustment, useQueryMeta, useQueryProductDetail, useQueryProductMovements } from "@/apiHooks";
import { useIdempotencyKey, useProductDetailUrlState } from "@/hooks";
import { Banner, QueryErrorState } from "@/components/common";
import { PageContainer } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, type AdjustStoreOption } from "@/helpers";
import { useCurrentUser } from "@/providers/SessionProvider";
import { AdjustStockDialog } from "@/components/adjust";
import { ApiError } from "@/api/axiosConfig";
import type { Adjustment } from "@/types";
import { ProductDetailHeader } from "./ProductDetailHeader";
import { ProductDetailSkeleton } from "./ProductDetailSkeleton";
import { StockChart } from "./StockChart";
import { ProductDetailsCard } from "./ProductDetailsCard";
import { StockByStoreTable } from "./StockByStoreTable";
import { MovementsTab } from "./MovementsTab";

export interface ProductDetailViewProps {
  productId: string;
}

export function ProductDetailView({ productId }: ProductDetailViewProps): ReactElement {
  const currentUser = useCurrentUser();
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustStoreId, setAdjustStoreId] = useState<string | undefined>(undefined);
  const [serverError, setServerError] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  const idempotencyKey = useIdempotencyKey();
  const adjustMutation = useMutationAdjustment(productId);

  const { query, setStore, setTab, setType, setPeriod, clearFilters, setPage, setPageSize } =
    useProductDetailUrlState();

  const {
    data: product,
    isFetching: isFetchingProduct,
    isError,
    error,
    refetch,
  } = useQueryProductDetail(productId, { store: query.store, fail: query.fail });

  const { data: unscopedProduct, refetch: refetchUnscoped } = useQueryProductDetail(productId);

  const { data: defaultMovements } = useQueryProductMovements(productId, {
    store: query.store,
    period: PERIOD.DAYS_30,
    page: DEFAULT_PAGE,
    pageSize: DEFAULT_PAGE_SIZE,
    fail: query.fail,
  });

  const { data: meta } = useQueryMeta();
  const stores = useMemo(() => meta?.stores ?? [], [meta?.stores]);
  const currentStoreObj = stores.find((s) => s.id === query.store);
  const storeName = currentStoreObj?.name;
  const tabCount = defaultMovements?.total;

  const adjustStores: AdjustStoreOption[] = useMemo(() => {
    const carrying = unscopedProduct?.stockByStore ?? product?.stockByStore ?? [];
    return carrying.map((item) => ({
      storeId: item.storeId,
      storeName: stores.find((s) => s.id === item.storeId)?.name ?? item.storeId,
      onHand: item.onHand,
      reorderLevel: item.reorderLevel,
    }));
  }, [unscopedProduct?.stockByStore, product?.stockByStore, stores]);

  const handleAdjust = useCallback(
    (storeId?: string) => {
      const initial = storeId ?? (query.store !== ALL_STORES ? query.store : undefined);
      setAdjustStoreId(initial);
      setServerError(null);
      setIsAdjustOpen(true);
    },
    [query.store],
  );

  const handleSubmitAdjustment = useCallback(
    async (payload: Adjustment) => {
      if (isSubmittingRef.current || adjustMutation.isPending) return;
      isSubmittingRef.current = true;
      setServerError(null);
      const key = idempotencyKey.getKey(payload);

      try {
        await adjustMutation.mutateAsync({ payload, idempotencyKey: key });
        idempotencyKey.onSuccess();
        setIsAdjustOpen(false);
      } catch (err: unknown) {
        idempotencyKey.onError(err);
        let message = "Something went wrong.";
        if (err instanceof ApiError || err instanceof Error) {
          message = err.message;
        }
        setServerError(message);
        void refetchUnscoped();
      } finally {
        isSubmittingRef.current = false;
      }
    },
    [adjustMutation, idempotencyKey, refetchUnscoped],
  );

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

    return <ProductDetailSkeleton tab={query.tab} />;
  }

  const isMovementsTabActive = query.tab === DETAIL_TAB.MOVEMENTS;

  return (
    <PageContainer>
      {isError && (
        <QueryErrorState error={error} onRetry={() => void refetch()} hasData={true} />
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
          className="border-border-default h-10 w-full justify-start gap-2xl rounded-none border-b p-0 overflow-x-auto overflow-y-hidden"
        >
          <TabsTrigger
            value={DETAIL_TAB.OVERVIEW}
            className="text-body-strong data-[state=active]:text-text-primary text-text-tertiary hover:text-text-secondary data-[state=active]:after:bg-accent-default rounded-none border-b-0 px-0 after:bottom-0 data-[state=active]:after:h-[2px]"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value={DETAIL_TAB.MOVEMENTS}
            className="text-body-strong data-[state=active]:text-text-primary text-text-tertiary hover:text-text-secondary data-[state=active]:after:bg-accent-default gap-sm rounded-none border-b-0 px-0 after:bottom-0 data-[state=active]:after:h-[2px]"
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
                period={query.period}
                onPeriodChange={setPeriod}
              />
              <ProductDetailsCard
                onHand={product.onHand}
                reorderLevel={product.reorderLevel}
                unitCostSen={product.unitCostSen}
                stockValueSen={product.stockValueSen}
                supplier={product.supplier}
                lastMovementAt={product.lastMovementAt}
                store={query.store}
                isFetching={isFetchingProduct}
              />
            </div>

            <StockByStoreTable
              stockByStore={product.stockByStore}
              stores={stores}
              onAdjust={handleAdjust}
              isFetching={isFetchingProduct}
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

      <AdjustStockDialog
        open={isAdjustOpen}
        onOpenChange={(open) => {
          setIsAdjustOpen(open);
          if (!open) setServerError(null);
        }}
        product={{ id: product.id, sku: product.sku, name: product.name }}
        stores={adjustStores}
        initialStoreId={adjustStoreId}
        user={currentUser}
        isSaving={adjustMutation.isPending}
        serverError={serverError}
        onSubmit={handleSubmitAdjustment}
      />
    </PageContainer>
  );
}
