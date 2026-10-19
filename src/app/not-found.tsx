import type { ReactElement } from "react";
import Link from "next/link";
import { SearchIcon } from "@/components/icons";
import { StateBlock } from "@/components/common";

export default function NotFound(): ReactElement {
  return (
    <div className="bg-bg-canvas flex min-h-[calc(100vh-64px)] flex-col items-center justify-center p-3xl">
      <StateBlock
        icon={SearchIcon}
        title="Page not found"
        description="The page you are looking for does not exist."
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
