import type { ReactElement } from "react";
import Link from "next/link";
import { BoxIcon } from "@/components/icons";
import { StateBlock } from "@/components/common";

export default function ProductNotFound(): ReactElement {
  return (
    <div className="bg-bg-canvas flex min-h-[calc(100vh-64px)] flex-col items-center justify-center p-3xl">
      <StateBlock
        icon={BoxIcon}
        title="Product not found"
        description="The requested product could not be found."
        actionElement={
          <Link
            href="/products"
            className="border-border-default bg-bg-surface hover:bg-bg-subtle text-text-primary text-label mt-4 inline-flex h-9 cursor-pointer items-center justify-center rounded-md border px-3 transition-colors"
          >
            Back to products
          </Link>
        }
      />
    </div>
  );
}
