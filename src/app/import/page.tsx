import type { ReactElement } from "react";
import { NOTICE, PERMISSION } from "@/constants";
import { PageContainer } from "@/components/layout";
import { requirePermissionOrRedirect } from "@/server/guards";

export default async function ImportPage(): Promise<ReactElement> {
  await requirePermissionOrRedirect(
    PERMISSION.IMPORT,
    `/products?notice=${NOTICE.MANAGERS_ONLY}`,
  );

  return (
    <PageContainer className="items-center justify-center">
      <h1 className="text-page-title text-text-primary">Import</h1>
      <p className="text-body text-text-secondary mt-2">CSV import</p>
    </PageContainer>
  );
}
