import type { Metadata } from "next";
import { QueryClient, HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ProductsView } from "@/components/products";
import { parseProductListParams } from "@/helpers";
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

  if (resolvedSearchParams.fail !== "1") {
    const repo = createRepository();
    const user = await getCurrentUser();

    await Promise.all([
      queryClient
        .query({
          queryKey: queryKeys.products.list(parsedParams),
          queryFn: () => listProducts(repo, parsedParams),
        })
        .catch(() => { }),
      queryClient
        .query({
          queryKey: queryKeys.meta.all,
          queryFn: () => getMeta(repo, user),
        })
        .catch(() => { }),
    ]);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductsView />
    </HydrationBoundary>
  );
}
