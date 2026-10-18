"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useProductListUrlState } from "@/hooks/useProductListUrlState";
import { useProductSelection } from "@/hooks/useProductSelection";
import { useQueryMeta, useQueryProductList } from "@/apiHooks";
import { Banner, Pagination } from "@/components/common";
import { buildCsv, downloadCsv, cn } from "@/helpers";
import type { CsvColumn } from "@/helpers";
import {
  ALL_STORES,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  STOCK_STATUS_LABEL,
} from "@/constants";
import { ProductsHeader } from "./ProductsHeader";
import { ProductsSummary } from "./ProductsSummary";
import { ProductsToolbar } from "./ProductsToolbar";
import { ProductsSelectionToolbar } from "./ProductsSelectionToolbar";
import { ProductsChips } from "./ProductsChips";
import { ProductsTable } from "./ProductsTable";
import type {
  PageSize,
  ProductListItem,
  ProductListSummary,
} from "@/types";

export function ProductsView(): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
    isError,
    error,
    refetch,
  } = useQueryProductList(query);
  const { data: meta } = useQueryMeta();

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
  });

  const handleExportSelected = useCallback(() => {
    const columns: CsvColumn<ProductListItem>[] = [
      { header: "SKU", accessor: (r) => r.sku },
      { header: "Name", accessor: (r) => r.name },
      { header: "Category", accessor: (r) => r.category },
      { header: "Status", accessor: (r) => STOCK_STATUS_LABEL[r.status] },
      { header: "On hand", accessor: (r) => r.onHand },
      { header: "Reorder level", accessor: (r) => r.reorderLevel },
      { header: "Unit cost", accessor: (r) => (r.unitCostSen / 100).toFixed(2) },
    ];

    const content = buildCsv(columns, selectedItems);
    const dateStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kuala_Lumpur",
    }).format(new Date());

    downloadCsv(`stockroom-products-${dateStr}.csv`, content);
  }, [selectedItems]);

  const notice = searchParams.get("notice");
  const showNotice = notice === "managers-only";

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
    <div className="bg-bg-canvas gap-2xl p-3xl flex flex-col">
      {showNotice && (
        <Banner
          variant="info"
          description="Import is available to managers only"
          onDismiss={handleDismissNotice}
          className="min-h-0 py-2.5"
        />
      )}

      <ProductsHeader totalProducts={summary.totalProducts} store={store} />

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
            pageSize={(query.pageSize ?? DEFAULT_PAGE_SIZE) as PageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>
    </div>
  );
}
