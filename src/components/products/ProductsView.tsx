"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  useProductListUrlState,
  useProductSelection,
  useProductsExport,
} from "@/hooks";
import { useQueryMeta, useQueryProductList } from "@/apiHooks";
import { Banner, Pagination } from "@/components/common";
import { PageContainer } from "@/components/layout";
import { buildCsv, downloadCsv, cn, productCsvColumns, normalizePageSize } from "@/helpers";
import {
  ALL_STORES,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  NOTICE,
  TIME_ZONE,
} from "@/constants";
import { useCurrentUser } from "@/providers";
import { ProductsHeader } from "./ProductsHeader";
import { ProductsSummary } from "./ProductsSummary";
import { ProductsToolbar } from "./ProductsToolbar";
import { ProductsSelectionToolbar } from "./ProductsSelectionToolbar";
import { ProductsChips } from "./ProductsChips";
import { ProductsTable } from "./ProductsTable";
import type {
  PageSize,
  ProductListSummary,
} from "@/types";

export function ProductsView(): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentUser = useCurrentUser();

  const {
    query,
    setSearch,
    setCategory,
    setStatus,
    setStore,
    clearFilters,
    setPage,
    setPageSize,
    toggleSort,
  } = useProductListUrlState();

  const {
    data: productsData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    dataUpdatedAt,
  } = useQueryProductList(query);
  const { data: meta } = useQueryMeta();
  const { exportAll, isExporting } = useProductsExport(query);

  const summary: ProductListSummary = productsData?.summary ?? {
    totalProducts: 0,
    stockValueSen: 0,
    lowStock: 0,
    outOfStock: 0,
  };

  const items = productsData?.items ?? [];
  const total = productsData?.total ?? 0;
  const categories = meta?.categories ?? [];
  const store = query.store ?? ALL_STORES;

  const currentStoreObj = meta?.stores.find((s) => s.id === store);
  const storeName = currentStoreObj?.name;

  const {
    selectedItems,
    count: selectedCount,
    isSelected,
    toggle: toggleSelect,
    togglePage,
    isPageSelected,
    isPagePartiallySelected,
    clear: clearSelection,
  } = useProductSelection({
    store: query.store,
    q: query.q,
    category: query.category,
    status: query.status,
    userId: currentUser.id,
  });

  const handleExportSelected = useCallback(() => {
    const sort = query.sort ?? "updatedAt";
    const dir = query.dir ?? "desc";

    const sortedItems = [...selectedItems].sort((a, b) => {
      if (sort === "status") {
        const orderMap: Record<string, number> = { out: 0, low: 1, in_stock: 2 };
        const diff = (orderMap[a.status] ?? 2) - (orderMap[b.status] ?? 2);
        if (diff !== 0) {
          return dir === "desc" ? diff : -diff;
        }
        return dir === "desc" ? a.sku.localeCompare(b.sku) : b.sku.localeCompare(a.sku);
      }

      let cmp = 0;
      if (sort === "sku") cmp = a.sku.localeCompare(b.sku);
      else if (sort === "name") cmp = a.name.localeCompare(b.name);
      else if (sort === "category") cmp = a.category.localeCompare(b.category);
      else if (sort === "onHand") cmp = a.onHand - b.onHand;
      else if (sort === "reorderLevel") cmp = a.reorderLevel - b.reorderLevel;
      else if (sort === "unitCostSen") cmp = a.unitCostSen - b.unitCostSen;
      else if (sort === "updatedAt") cmp = a.updatedAt.localeCompare(b.updatedAt);

      return dir === "desc" ? -cmp : cmp;
    });

    const content = buildCsv(productCsvColumns, sortedItems);
    const dateStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: TIME_ZONE,
    }).format(new Date());

    downloadCsv(`stockroom-products-${dateStr}.csv`, content);
  }, [selectedItems, query.sort, query.dir]);

  const notice = searchParams.get("notice");
  const showNotice = notice === NOTICE.MANAGERS_ONLY;

  const handleDismissNotice = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("notice");
    const qs = nextParams.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [searchParams, router, pathname]);

  const hasFilters = Boolean(
    (query.q && query.q.trim()) ||
    (query.category && query.category !== ALL_STORES) ||
    query.status,
  );

  const showErrorEmpty = isError && items.length === 0;

  return (
    <PageContainer>
      {showNotice && (
        <Banner
          variant="info"
          description="Import is available to managers only"
          onDismiss={handleDismissNotice}
          className="min-h-0 py-2.5"
        />
      )}

      <ProductsHeader
        totalProducts={summary.totalProducts}
        store={store}
        dataUpdatedAt={dataUpdatedAt}
        onExport={() => void exportAll()}
        isExporting={isExporting}
      />


      <ProductsSummary
        summary={summary}
        store={store}
        isLoading={isLoading && !productsData}
        categoriesCount={meta?.categories.length}
        currentStatus={query.status}
        onStatusChange={setStatus}
      />

      <div
        className={cn(
          "border-border-default bg-bg-surface shadow-card rounded-lg border",
          showErrorEmpty && "min-h-[calc(100vh-64px)]",
        )}
      >
        {selectedCount > 0 ? (
          <ProductsSelectionToolbar
            selectedCount={selectedCount}
            isAllPageSelected={isPageSelected(items)}
            onTogglePage={() => togglePage(items)}
            onExport={handleExportSelected}
            onClearSelection={clearSelection}
          />
        ) : (
          <ProductsToolbar
            search={query.q}
            category={query.category}
            status={query.status}
            categories={categories}
            totalResults={total}
            onSearchChange={setSearch}
            onCategoryChange={setCategory}
            onStatusChange={setStatus}
          />
        )}

        <ProductsChips
          store={store}
          storeName={storeName}
          search={query.q}
          category={query.category}
          status={query.status}
          onRemoveStore={() => setStore(ALL_STORES)}
          onRemoveSearch={() => setSearch(undefined)}
          onRemoveCategory={() => setCategory(undefined)}
          onRemoveStatus={() => setStatus(undefined)}
          onClearAll={clearFilters}
        />

        <ProductsTable
          items={items}
          isLoading={isLoading}
          isFetching={isFetching}
          isError={isError}
          error={error}
          store={store}
          sort={query.sort}
          dir={query.dir}
          onSort={toggleSort}
          onRetry={() => {
            void refetch();
          }}
          isSelected={isSelected}
          onToggleSelect={toggleSelect}
          isAllPageSelected={isPageSelected(items)}
          isPartiallyPageSelected={isPagePartiallySelected(items)}
          onTogglePage={() => togglePage(items)}
          hasFilters={hasFilters}
          onClearFilters={clearFilters}
        />

        {!showErrorEmpty && (
          <Pagination
            page={query.page ?? DEFAULT_PAGE}
            pageSize={normalizePageSize(query.pageSize)}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>
    </PageContainer>
  );
}
