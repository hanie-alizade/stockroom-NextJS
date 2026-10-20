import type { Metadata } from "next";
import { QueryClient, HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ProductsView } from "@/components/products";
import { parseProductListParams, shouldSkipPrefetch } from "@/helpers";
import { queryKeys } from "@/constants";
import { createRepository } from "@/server/repositories";
import { listProducts } from "@/server/services/products";

import { getMeta } from "@/server/services/meta";
import { getCurrentUser } from "@/server/session";

export const metadata: Metadata = {
  title: "Products",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProductsPage({
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const resolvedSearchParams = await searchParams;
  const parsedParams = parseProductListParams(resolvedSearchParams);

  const queryClient = new QueryClient();

  if (!shouldSkipPrefetch(resolvedSearchParams)) {
    const repo = createRepository();
    const user = await getCurrentUser();

    // A failed prefetch is not dehydrated, so the client refetches and shows the real error state with retry.
    await Promise.all([
      queryClient
        .query({
          queryKey: queryKeys.products.list(parsedParams),
          queryFn: () => listProducts(repo, parsedParams),
        })
        .catch((error: unknown) => {
          // eslint-disable-next-line no-console -- Server-side prefetch logging
          console.error("[prefetch:products]", error);
        }),
      queryClient
        .query({
          queryKey: queryKeys.meta.all,
          queryFn: () => getMeta(repo, user),
        })
        .catch((error: unknown) => {
          // eslint-disable-next-line no-console -- Server-side prefetch logging
          console.error("[prefetch:meta]", error);
        }),
    ]);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductsView />
    </HydrationBoundary>
  );
}
