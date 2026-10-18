import type { Metadata } from "next";
import { QueryClient, HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ProductsView } from "@/components/products/productsView";
import { parseProductListParams } from "@/helpers";
import { queryKeys } from "@/constants";
import { createRepository } from "@/server/repositories";
import { listProducts } from "@/server/services/products";

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
  const repo = createRepository();

  await queryClient.prefetchQuery({
    queryKey: queryKeys.products.list(parsedParams),
    queryFn: () => listProducts(repo, parsedParams),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductsView />
    </HydrationBoundary>
  );
}
