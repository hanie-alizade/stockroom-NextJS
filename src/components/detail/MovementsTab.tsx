"use client";

import { useEffect, type ReactElement } from "react";
import { PERIOD } from "@/constants";
import { useQueryProductMovements } from "@/apiHooks";
import { Banner, Pagination, StateBlock } from "@/components/common";
import { BoxIcon, CircleAlertIcon, SearchIcon } from "@/components/icons";
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
  onPageChange: (page: number) => void;
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
  const { data, isLoading, isFetching, isError, refetch } = useQueryProductMovements(productId, {
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
        onPageChange(maxPage);
      }
    }
  }, [total, pageSize, page, onPageChange]);

  const hasFilters = Boolean(type !== undefined || period !== PERIOD.DAYS_30);
  const hasOldData = items.length > 0;
  const showErrorWithOldData = isError && hasOldData;
  const showErrorEmpty = isError && !hasOldData;
  const showEmpty = !isLoading && !isError && items.length === 0;

  let content: ReactElement;

  if (showErrorEmpty) {
    content = (
      <div className="flex flex-col p-4">
        <Banner
          variant="danger"
          title="We couldn't load movements"
          description="The server returned an error (500). Your data hasn't changed."
          actionText="Try again"
          onAction={() => void refetch()}
        />
        <div className="mt-12 flex justify-center pb-12">
          <StateBlock
            icon={CircleAlertIcon}
            iconVariant="danger"
            title="Something went wrong"
            description="We couldn't load this page. Your data is safe."
            actionText="Try again"
            onAction={() => void refetch()}
          />
        </div>
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
          isLoading={isLoading && !hasOldData}
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
          <div className="p-4 pb-0">
            <Banner
              variant="danger"
              title="We couldn't load movements"
              description="The server returned an error (500). Your data hasn't changed."
              actionText="Try again"
              onAction={() => void refetch()}
            />
          </div>
        )}

        {content}
      </div>
    </div>
  );
}
