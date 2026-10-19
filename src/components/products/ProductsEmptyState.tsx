"use client";

import { useRouter } from "next/navigation";
import { BoxIcon, SearchIcon } from "@/components/icons";
import { EmptyState } from "@/components/common";
import { useHasPermission } from "@/providers";
import { PERMISSION } from "@/constants";

interface ProductsEmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
}

export function ProductsEmptyState({
  hasFilters,
  onClearFilters,
}: ProductsEmptyStateProps): React.ReactElement {
  const router = useRouter();
  const hasImportPermission = useHasPermission(PERMISSION.IMPORT);

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
      actionText={hasImportPermission ? "Import CSV" : undefined}
      onAction={hasImportPermission ? () => router.push("/import") : undefined}
      actionElement={
        !hasImportPermission ? (
          <p className="text-body-small text-text-tertiary">
            Ask a manager to import products.
          </p>
        ) : undefined
      }
      className="py-16"
    />
  );
}
