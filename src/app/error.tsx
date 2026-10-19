"use client";

import type { ReactElement } from "react";
import { CircleAlertIcon } from "@/components/icons";
import { StateBlock } from "@/components/common";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ reset }: ErrorPageProps): ReactElement {
  return (
    <div className="bg-bg-canvas flex min-h-[calc(100vh-64px)] flex-col items-center justify-center p-3xl">
      <StateBlock
        icon={CircleAlertIcon}
        iconVariant="danger"
        title="Something went wrong"
        description="We couldn't load this page. Your data is safe."
        actionText="Try again"
        onAction={reset}
      />
    </div>
  );
}
