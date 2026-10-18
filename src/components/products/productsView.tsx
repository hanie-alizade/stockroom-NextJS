"use client";

import { useProductListUrlState } from "@/hooks/useProductListUrlState";
import { useQueryMeta, useQueryProductList } from "@/apiHooks";
import { ProductsHeader } from "./productsHeader";
import { ProductsSummary } from "./productsSummary";
import { ProductsToolbar } from "./productsToolbar";
import { ProductsTable } from "./productsTable";
import { Pagination } from "@/components/common/pagination";
import { ALL_STORES, DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from "@/constants";
import type { PageSize, ProductListSummary } from "@/types";

export function ProductsView(): React.ReactElement {
  const { query, setSearch, setCategory, setStatus, setPage, setPageSize, toggleSort } =
    useProductListUrlState();

  const { data: productsData, isLoading, isError } = useQueryProductList(query);
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

  return (
    <div className="bg-bg-canvas gap-2xl p-3xl flex flex-col">
      <ProductsHeader totalProducts={summary.totalProducts} store={store} />

      <ProductsSummary summary={summary} store={store} />

      <div className="border-border-default bg-bg-surface shadow-card rounded-lg border">
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

        <ProductsTable
          items={items}
          isLoading={isLoading}
          isError={isError}
          store={store}
          sort={query.sort}
          dir={query.dir}
          onSort={toggleSort}
        />

        <Pagination
          page={query.page ?? DEFAULT_PAGE}
          pageSize={(query.pageSize ?? DEFAULT_PAGE_SIZE) as PageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
}
