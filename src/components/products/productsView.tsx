"use client";

import { useProductListUrlState } from "@/lib/client/products/useProductListUrlState";
import { useProductList } from "@/lib/client/products/useProductList";
import { useQueryMeta } from "@/lib/client/apiHooks";
import { ProductsHeader } from "./productsHeader";
import { ProductsSummary } from "./productsSummary";
import { ProductsToolbar } from "./productsToolbar";
import { ProductsTable } from "./productsTable";
import { Pagination } from "@/components/common/pagination";
import type { ProductListSummary } from "@/lib/types/product";
import type { PageSize } from "@/lib/types/common";

export function ProductsView(): React.ReactElement {
  const { query, setSearch, setCategory, setStatus, setPage, setPageSize, toggleSort } =
    useProductListUrlState();

  const { data: productsData, isLoading, isError } = useProductList(query);
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
  const store = query.store ?? "all";

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
          page={query.page ?? 1}
          pageSize={(query.pageSize ?? 25) as PageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
}
