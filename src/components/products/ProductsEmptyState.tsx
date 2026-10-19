"use client";

import { useRouter } from "next/navigation";
import { BoxIcon, SearchIcon } from "@/components/icons";
import { EmptyState, PermissionGate } from "@/components/common";
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
    <PermissionGate
      permission={PERMISSION.IMPORT}
      fallback={
        <EmptyState
          icon={BoxIcon}
          title="No products yet"
          description="Import a CSV to get started. You can download a template first."
          actionElement={
            <p className="text-body-small text-text-tertiary">
              Ask a manager to import products.
            </p>
          }
          className="py-16"
        />
      }
    >
      <EmptyState
        icon={BoxIcon}
        title="No products yet"
        description="Import a CSV to get started. You can download a template first."
        actionText="Import CSV"
        onAction={() => router.push("/import")}
        className="py-16"
      />
    </PermissionGate>
  );
}
