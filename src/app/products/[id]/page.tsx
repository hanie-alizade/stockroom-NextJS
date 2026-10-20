import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { ProductDetailView } from "@/components/detail";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  DETAIL_TAB,
  ERROR_CODE,
  PERIOD,
  queryKeys,
} from "@/constants";
import { AppError } from "@/domain";
import { parseProductDetailParams, shouldSkipPrefetch } from "@/helpers";
import { createRepository } from "@/server/repositories";
import { getMeta } from "@/server/services/meta";
import { getProductDetail, getProductMovements, getStockHistory } from "@/server/services/products";
import { getCurrentUser } from "@/server/session";

export const metadata: Metadata = {
  title: "Product",
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const parsed = parseProductDetailParams(resolvedSearchParams);

  const queryClient = new QueryClient();

  if (!shouldSkipPrefetch(resolvedSearchParams)) {
    const repo = createRepository();
    const user = await getCurrentUser();

    try {
      await queryClient.fetchQuery({
        queryKey: queryKeys.products.detail(id, { store: parsed.store }),
        queryFn: () => getProductDetail(repo, id, parsed.store),
      });
    } catch (err) {
      if (err instanceof AppError && err.code === ERROR_CODE.PRODUCT_NOT_FOUND) {
        notFound();
      }
      // A failed prefetch is not dehydrated, so the client refetches and shows the real error state with retry.
      // eslint-disable-next-line no-console -- Server-side prefetch logging
      console.error("[prefetch:product-detail]", err);
    }

    const defaultMovementsQuery = {
      store: parsed.store,
      period: PERIOD.DAYS_30,
      page: DEFAULT_PAGE,
      pageSize: DEFAULT_PAGE_SIZE,
    };

    const prefetchPromises: Promise<unknown>[] = [
      queryClient.prefetchQuery({
        queryKey: queryKeys.products.movements(id, defaultMovementsQuery),
        queryFn: () => getProductMovements(repo, id, defaultMovementsQuery),
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.meta.all,
        queryFn: () => getMeta(repo, user),
      }),
    ];

    if (parsed.tab === DETAIL_TAB.OVERVIEW) {
      prefetchPromises.push(
        queryClient.prefetchQuery({
          queryKey: queryKeys.products.stockHistory(id, {
            store: parsed.store,
            days: 30,
          }),
          queryFn: () => getStockHistory(repo, id, parsed.store, 30),
        }),
      );
    } else if (parsed.tab === DETAIL_TAB.MOVEMENTS) {
      const filteredMovementsQuery = {
        store: parsed.store,
        type: parsed.type,
        period: parsed.period,
        page: parsed.page,
        pageSize: parsed.pageSize,
      };

      const isNonDefault =
        parsed.type !== undefined ||
        parsed.period !== PERIOD.DAYS_30 ||
        parsed.page !== DEFAULT_PAGE ||
        parsed.pageSize !== DEFAULT_PAGE_SIZE;

      if (isNonDefault) {
        prefetchPromises.push(
          queryClient.prefetchQuery({
            queryKey: queryKeys.products.movements(id, filteredMovementsQuery),
            queryFn: () => getProductMovements(repo, id, filteredMovementsQuery),
          }),
        );
      }
    }

    await Promise.all(prefetchPromises);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductDetailView productId={id} />
    </HydrationBoundary>
  );
}
