import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductsTable } from "../ProductsTable";
import { ProductsSelectionToolbar } from "../ProductsSelectionToolbar";
import { STOCK_STATUS } from "@/constants";
import type { ProductListItem } from "@/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/products",
  useSearchParams: () => new URLSearchParams(),
}));

beforeAll(() => {
  if (typeof window !== "undefined") {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    window.HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
    window.HTMLElement.prototype.setPointerCapture = vi.fn();
    window.HTMLElement.prototype.releasePointerCapture = vi.fn();
  }
  if (typeof window.ResizeObserver === "undefined") {
    window.ResizeObserver = class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    };
  }
});

const mockProducts: ProductListItem[] = [
  {
    id: "prod-1",
    sku: "KL-001",
    name: "Espresso Roast",
    category: "Coffee",
    supplier: "Kopi Supply",
    unitCostSen: 1200,
    onHand: 24,
    reorderLevel: 10,
    status: STOCK_STATUS.IN_STOCK,
    updatedAt: "2026-03-01T00:00:00.000Z",
  },
  {
    id: "prod-2",
    sku: "KL-002",
    name: "Vanilla Syrup",
    category: "Syrups",
    supplier: "Sweet Corp",
    unitCostSen: 850,
    onHand: 5,
    reorderLevel: 10,
    status: STOCK_STATUS.LOW,
    updatedAt: "2026-03-01T00:00:00.000Z",
  },
];

function renderTable(props: Partial<React.ComponentProps<typeof ProductsTable>> = {}) {
  const defaultProps = {
    items: mockProducts,
    isLoading: false,
    isFetching: false,
    isPlaceholderData: false,
    isError: false,
    store: "all",
    onSort: vi.fn(),
    onRetry: vi.fn(),
    isSelected: vi.fn(() => false),
    onToggleSelect: vi.fn(),
    isAllPageSelected: false,
    isPartiallyPageSelected: false,
    onTogglePage: vi.fn(),
    hasFilters: false,
    onClearFilters: vi.fn(),
    ...props,
  };

  return render(<ProductsTable {...defaultProps} />);
}

describe("ProductsTable loading and skeleton behavior", () => {
  it("shows skeleton rows and aria-busy when isPlaceholderData is true", () => {
    const { container } = renderTable({
      isPlaceholderData: true,
      items: mockProducts,
    });

    const table = screen.getByRole("table");
    expect(table).toHaveAttribute("aria-busy", "true");

    // Skeleton rows must be displayed
    const skeletonRows = container.querySelectorAll("tbody tr[aria-hidden='true']");
    expect(skeletonRows.length).toBe(9);

    // Old product rows should NOT be visible
    expect(screen.queryByText("Espresso Roast")).not.toBeInTheDocument();
    expect(screen.queryByText("Vanilla Syrup")).not.toBeInTheDocument();

    // Polite live region announces "Loading products"
    const liveRegion = screen.getByRole("status");
    expect(liveRegion).toHaveAttribute("aria-live", "polite");
    expect(liveRegion).toHaveTextContent("Loading products");
  });

  it("keeps old rows visible without skeleton on plain background refetch (same key)", () => {
    const { container } = renderTable({
      isLoading: false,
      isFetching: true,
      isPlaceholderData: false,
      items: mockProducts,
    });

    const table = screen.getByRole("table");
    expect(table).not.toHaveAttribute("aria-busy");

    // No skeleton rows
    const skeletonRows = container.querySelectorAll("tbody tr[aria-hidden='true']");
    expect(skeletonRows.length).toBe(0);

    // Real product rows are visible in both desktop table and mobile cards
    expect(screen.getAllByText("Espresso Roast").length).toBe(2);
    expect(screen.getAllByText("Vanilla Syrup").length).toBe(2);

    // Live region does not announce loading
    const liveRegion = screen.getByRole("status");
    expect(liveRegion).toHaveTextContent("");
  });

  it("marks all skeleton rows with aria-hidden='true'", () => {
    const { container } = renderTable({
      isLoading: true,
      items: [],
    });

    const skeletonRows = container.querySelectorAll("tbody tr");
    expect(skeletonRows.length).toBe(9);
    skeletonRows.forEach((row) => {
      expect(row).toHaveAttribute("aria-hidden", "true");
    });
  });

  it("selection stays intact while skeleton shows", () => {
    const isSelected = vi.fn((id: string) => id === "prod-1");

    // Test selection toolbar and table together during placeholder data
    render(
      <div>
        <ProductsSelectionToolbar
          selectedCount={1}
          isAllPageSelected={false}
          onTogglePage={vi.fn()}
          onExport={vi.fn()}
          onClearSelection={vi.fn()}
        />
        <ProductsTable
          items={mockProducts}
          isLoading={false}
          isFetching={true}
          isPlaceholderData={true}
          isError={false}
          store="all"
          onSort={vi.fn()}
          onRetry={vi.fn()}
          isSelected={isSelected}
          onToggleSelect={vi.fn()}
          isAllPageSelected={false}
          isPartiallyPageSelected={true}
          onTogglePage={vi.fn()}
          hasFilters={false}
          onClearFilters={vi.fn()}
        />
      </div>,
    );

    // Selection toolbar remains on screen with selected count intact
    expect(screen.getByText("1 selected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export selected" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear selection" })).toBeInTheDocument();

    // Table is aria-busy with skeleton rows
    const table = screen.getByRole("table");
    expect(table).toHaveAttribute("aria-busy", "true");
  });
});
