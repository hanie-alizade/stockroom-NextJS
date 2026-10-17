import { EmptyState } from "@/components/stockroom/empty-state";

export function EmptyStateShowcase(): React.ReactElement {
  return (
    <section>
      <h2 className="text-section text-text-primary mb-lg">Empty States</h2>
      <div className="space-y-3xl">
        <EmptyState
          variant="no-results"
          title="No results found"
          description="Try adjusting your search or filters to find what you're looking for."
          actionLabel="Clear filters"
          onAction={() => {}}
        />
        <EmptyState
          variant="no-products"
          title="No products yet"
          description="Get started by adding your first product to the inventory."
          actionLabel="Import products"
          onAction={() => {}}
        />
        <EmptyState
          variant="error"
          title="Something went wrong"
          description="We couldn't load the data. Please try again."
          actionLabel="Retry"
          onAction={() => {}}
        />
      </div>
    </section>
  );
}
