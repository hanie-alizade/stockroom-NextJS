"use client";

import { useRouter } from "next/navigation";
import { BoxIcon, SearchIcon } from "@/components/icons";
import { EmptyState } from "@/components/common";
import { useCan } from "@/providers";
import { ACTION } from "@/constants";

interface ProductsEmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
}

export function ProductsEmptyState({
  hasFilters,
  onClearFilters,
}: ProductsEmptyStateProps): React.ReactElement {
  const router = useRouter();
  const canImport = useCan(ACTION.IMPORT);

  if (hasFilters) {
    return (
      <EmptyState
        icon={SearchIcon}
        title="No products match these filters"
        description="Try a different search or remove a filter."
        actionText="Clear filters"
        onAction={onClearFilters}
        className="py-16"
      />
    );
  }

  return (
    <EmptyState
      icon={BoxIcon}
      title="No products yet"
      description="Import a CSV to get started. You can download a template first."
      actionText={canImport ? "Import CSV" : undefined}
      onAction={canImport ? () => router.push("/import") : undefined}
      actionElement={
        !canImport ? (
          <p className="text-body-small text-text-tertiary">
            Ask a manager to import products.
          </p>
        ) : undefined
      }
      className="py-16"
    />
  );
}
