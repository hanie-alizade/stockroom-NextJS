import type { Metadata } from "next";
import type { ReactElement } from "react";
import { QueryClient, HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ImportWizard } from "@/components/import";
import { PageContainer } from "@/components/layout";
import { NOTICE, PERMISSION, queryKeys } from "@/constants";
import { requirePermissionOrRedirect } from "@/server/guards";
import { createRepository } from "@/server/repositories";
import { getMeta } from "@/server/services/meta";
import { getCurrentUser } from "@/server/session";

export const metadata: Metadata = {
  title: "Import products",
};

interface ImportPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ImportPage({
  searchParams,
}: ImportPageProps): Promise<ReactElement> {
  await requirePermissionOrRedirect(
    PERMISSION.IMPORT,
    `/products?notice=${NOTICE.MANAGERS_ONLY}`,
  );

  const resolvedSearchParams = await searchParams;
  const storeParam =
    typeof resolvedSearchParams.store === "string"
      ? resolvedSearchParams.store
      : undefined;

  const repo = createRepository();
  const stores = repo.getStores();
  const validStore = stores.find((s) => s.id === storeParam);
  const initialStore = validStore ? validStore.id : (stores[0]?.id ?? "mont-kiara");

  const queryClient = new QueryClient();
  const user = await getCurrentUser();

  await queryClient
    .query({
      queryKey: queryKeys.meta.all,
      queryFn: () => getMeta(repo, user),
    })
    .catch(() => {});

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PageContainer className="flex-col">
        <ImportWizard store={initialStore} />
      </PageContainer>
    </HydrationBoundary>
  );
}
