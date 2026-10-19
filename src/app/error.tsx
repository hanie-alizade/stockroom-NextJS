"use client";

import type { ReactElement } from "react";
import { CircleAlertIcon } from "@/components/icons";
import { StateBlock } from "@/components/common";
import { PageContainer } from "@/components/layout";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ reset }: ErrorPageProps): ReactElement {
  return (
    <PageContainer className="items-center justify-center">
      <StateBlock
        icon={CircleAlertIcon}
        iconVariant="danger"
        title="Something went wrong"
        description="We couldn't load this page. Your data is safe."
        actionText="Try again"
        onAction={reset}
      />
    </PageContainer>
  );
}
