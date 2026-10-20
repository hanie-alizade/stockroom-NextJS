"use client";

import { useEffect, type ReactElement } from "react";
import { PERIOD } from "@/constants";
import { useQueryProductMovements } from "@/apiHooks";
import { Pagination, QueryErrorState, StateBlock } from "@/components/common";
import { BoxIcon, SearchIcon } from "@/components/icons";
import { MovementsFilters } from "./MovementsFilters";
import { MovementsTable } from "./MovementsTable";
import type { MovementPeriod, MovementType, PageSize, Store, StoreScope } from "@/types";

export interface MovementsTabProps {
  productId: string;
  store: StoreScope;
  type?: MovementType;
  period: MovementPeriod;
  page: number;
  pageSize: PageSize;
  fail?: string;
  stores: Store[];
  onTypeChange: (type?: MovementType) => void;
  onStoreChange: (store: StoreScope) => void;
  onPeriodChange: (period: MovementPeriod) => void;
  onClearFilters: () => void;
  onPageChange: (page: number, replace?: boolean) => void;
  onPageSizeChange: (pageSize: PageSize) => void;
  onAdjust: (storeId?: string) => void;
}

export function MovementsTab({
  productId,
  store,
  type,
  period,
  page,
  pageSize,
  fail,
  stores,
  onTypeChange,
  onStoreChange,
  onPeriodChange,
  onClearFilters,
  onPageChange,
  onPageSizeChange,
  onAdjust,
}: MovementsTabProps): ReactElement {
  const { data, isLoading, isFetching, isPlaceholderData, isError, error, refetch } =
    useQueryProductMovements(productId, {
      store,
      type,
      period,
      page,
      pageSize,
      fail,
    });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  useEffect(() => {
    if (total > 0) {
      const maxPage = Math.max(1, Math.ceil(total / pageSize));
      if (page > maxPage) {
        onPageChange(maxPage, true);
      }
    }
  }, [total, pageSize, page, onPageChange]);

  const hasFilters = Boolean(type !== undefined || period !== PERIOD.DAYS_30);
  const hasOldData = items.length > 0;
  const showErrorWithOldData = isError && hasOldData;
  const showErrorEmpty = isError && !hasOldData;
  const showSkeleton = isLoading || isPlaceholderData;
  const showEmpty = !showSkeleton && !isError && items.length === 0;

  let content: ReactElement;

  if (showErrorEmpty) {
    content = (
      <QueryErrorState
        error={error}
        onRetry={() => void refetch()}
        hasData={false}
        variant="section"
        title="We couldn't load movements"
      />
    );
  } else if (showSkeleton) {
    content = (
      <div>
        <MovementsTable
          items={items}
          stores={stores}
          isLoading={true}
          isFetching={isFetching}
        />

        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </div>
    );
  } else if (showEmpty) {
    content = (
      <div className="flex justify-center p-8">
        {hasFilters ? (
          <StateBlock
            icon={SearchIcon}
            title="No movements match these filters"
            description="Try a different type, store or period."
            actionText="Clear filters"
            onAction={onClearFilters}
          />
        ) : (
          <StateBlock
            icon={BoxIcon}
            title="No movements yet"
            description="Stock changes for this product will show up here."
            actionText="Receive stock"
            onAction={() => onAdjust()}
          />
        )}
      </div>
    );
  } else {
    content = (
      <div className={showErrorWithOldData ? "opacity-60" : undefined}>
        <MovementsTable
          items={items}
          stores={stores}
          isLoading={false}
          isFetching={isFetching}
        />

        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <MovementsFilters
        type={type}
        store={store}
        period={period}
        total={total}
        stores={stores}
        onTypeChange={onTypeChange}
        onStoreChange={onStoreChange}
        onPeriodChange={onPeriodChange}
      />

      <div className="bg-bg-surface border-border-default shadow-card mt-xl rounded-lg border overflow-hidden">
        {showErrorWithOldData && (
          <QueryErrorState
            error={error}
            onRetry={() => void refetch()}
            hasData={true}
            title="We couldn't load movements"
            className="p-4 pb-0"
          />
        )}

        {content}
      </div>
    </div>
  );
}
