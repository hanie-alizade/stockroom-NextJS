import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  PRODUCT_SORT_KEY,
  SORT_DIRECTION,
  STOCK_STATUS,
} from "@/constants";
import type { ProductSortKey } from "@/types";
import {
  FiltersForm,
  ProductsFiltersSheet,
  SORT_OPTIONS,
  SORT_LABEL_MAP,
  isProductSortKey,
} from "../ProductsFiltersSheet";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ProductsToolbar } from "../ProductsToolbar";

const mockPush = vi.fn();
const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => "/products",
  useSearchParams: () => mockSearchParams,
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

const defaultCategories = [
  { name: "Bakery" },
  { name: "Coffee" },
  { name: "Tea" },
];

function renderFiltersForm(ui: React.ReactElement) {
  return render(
    <Sheet open={true}>
      <SheetContent>{ui}</SheetContent>
    </Sheet>,
  );
}

describe("ProductsFiltersSheet unit and helpers", () => {
  it("derives SORT_LABEL_MAP from SORT_OPTIONS with all entries matching", () => {
    expect(SORT_OPTIONS.length).toBeGreaterThan(0);

    for (const option of SORT_OPTIONS) {
      expect(SORT_LABEL_MAP[option.value]).toBe(option.label);
    }
  });

  it("validates sort keys correctly using isProductSortKey type guard", () => {
    expect(isProductSortKey(PRODUCT_SORT_KEY.UPDATED_AT)).toBe(true);
    expect(isProductSortKey(PRODUCT_SORT_KEY.SKU)).toBe(true);
    expect(isProductSortKey(PRODUCT_SORT_KEY.NAME)).toBe(true);
    expect(isProductSortKey("invalid_key")).toBe(false);
    expect(isProductSortKey("")).toBe(false);
  });
});

describe("FiltersForm", () => {
  it("links each label to its select trigger using id and aria-labelledby", () => {
    renderFiltersForm(
      <FiltersForm
        categories={defaultCategories}
        onApply={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const categoryLabel = screen.getByText("Category");
    expect(categoryLabel).toHaveAttribute("id", "filters-category-label");
    const categoryTrigger = screen.getByRole("combobox", { name: "Category" });
    expect(categoryTrigger).toHaveAttribute("aria-labelledby", "filters-category-label");
    expect(categoryTrigger).toHaveAttribute("id", "filters-category-select");

    const statusLabel = screen.getByText("Status");
    expect(statusLabel).toHaveAttribute("id", "filters-status-label");
    const statusTrigger = screen.getByRole("combobox", { name: "Status" });
    expect(statusTrigger).toHaveAttribute("aria-labelledby", "filters-status-label");
    expect(statusTrigger).toHaveAttribute("id", "filters-status-select");

    const sortLabel = screen.getByText("Sort by");
    expect(sortLabel).toHaveAttribute("id", "filters-sort-label");
    const sortTrigger = screen.getByRole("combobox", { name: "Sort by" });
    expect(sortTrigger).toHaveAttribute("aria-labelledby", "filters-sort-label");
    expect(sortTrigger).toHaveAttribute("id", "filters-sort-select");
  });

  it("calls onApply with current values and onClose when clicking Done", async () => {
    const user = userEvent.setup();
    const handleApply = vi.fn();
    const handleClose = vi.fn();

    renderFiltersForm(
      <FiltersForm
        category="Coffee"
        status={STOCK_STATUS.LOW}
        sort={PRODUCT_SORT_KEY.NAME}
        dir={SORT_DIRECTION.ASC}
        categories={defaultCategories}
        onApply={handleApply}
        onClose={handleClose}
      />,
    );

    const doneButton = screen.getByRole("button", { name: "Done" });
    await user.click(doneButton);

    expect(handleApply).toHaveBeenCalledWith({
      category: "Coffee",
      status: STOCK_STATUS.LOW,
      sort: PRODUCT_SORT_KEY.NAME,
      dir: SORT_DIRECTION.ASC,
    });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("toggles sort direction between Asc and Desc", async () => {
    const user = userEvent.setup();
    const handleApply = vi.fn();

    renderFiltersForm(
      <FiltersForm
        dir={SORT_DIRECTION.DESC}
        categories={defaultCategories}
        onApply={handleApply}
        onClose={vi.fn()}
      />,
    );

    const toggleButton = screen.getByRole("button", { name: "Sort descending" });
    await user.click(toggleButton);

    const doneButton = screen.getByRole("button", { name: "Done" });
    await user.click(doneButton);

    expect(handleApply).toHaveBeenCalledWith(
      expect.objectContaining({
        dir: SORT_DIRECTION.ASC,
      }),
    );
  });

  it("resets draft values to defaults when Reset button is clicked", async () => {
    const user = userEvent.setup();
    const handleApply = vi.fn();

    renderFiltersForm(
      <FiltersForm
        category="Coffee"
        status={STOCK_STATUS.OUT}
        sort={PRODUCT_SORT_KEY.NAME}
        dir={SORT_DIRECTION.ASC}
        categories={defaultCategories}
        onApply={handleApply}
        onClose={vi.fn()}
      />,
    );

    const resetButton = screen.getByRole("button", { name: "Reset" });
    await user.click(resetButton);

    const doneButton = screen.getByRole("button", { name: "Done" });
    await user.click(doneButton);

    expect(handleApply).toHaveBeenCalledWith({
      category: undefined,
      status: undefined,
      sort: PRODUCT_SORT_KEY.UPDATED_AT,
      dir: SORT_DIRECTION.DESC,
    });
  });
});

describe("ProductsFiltersSheet", () => {
  it("renders trigger button with active filters count badge", () => {
    render(
      <ProductsFiltersSheet
        isOpen={false}
        onOpenChange={vi.fn()}
        categories={defaultCategories}
        activeFiltersCount={2}
        onApply={vi.fn()}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Filters" });
    expect(trigger).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders FiltersForm only when sheet is open", () => {
    const { rerender } = render(
      <ProductsFiltersSheet
        isOpen={false}
        onOpenChange={vi.fn()}
        categories={defaultCategories}
        activeFiltersCount={0}
        onApply={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "Done" })).not.toBeInTheDocument();

    rerender(
      <ProductsFiltersSheet
        isOpen={true}
        onOpenChange={vi.fn()}
        categories={defaultCategories}
        activeFiltersCount={0}
        onApply={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
  });

  it("discards changes when closing without clicking Done", async () => {
    const user = userEvent.setup();
    let isOpen = true;
    const handleOpenChange = vi.fn((open: boolean) => {
      isOpen = open;
    });

    const { rerender } = render(
      <ProductsFiltersSheet
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
        category="Bakery"
        status={STOCK_STATUS.IN_STOCK}
        sort={PRODUCT_SORT_KEY.SKU}
        dir={SORT_DIRECTION.ASC}
        categories={defaultCategories}
        activeFiltersCount={2}
        onApply={vi.fn()}
      />,
    );

    const resetButton = screen.getByRole("button", { name: "Reset" });
    await user.click(resetButton);

    // Close without Done
    isOpen = false;
    rerender(
      <ProductsFiltersSheet
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
        category="Bakery"
        status={STOCK_STATUS.IN_STOCK}
        sort={PRODUCT_SORT_KEY.SKU}
        dir={SORT_DIRECTION.ASC}
        categories={defaultCategories}
        activeFiltersCount={2}
        onApply={vi.fn()}
      />,
    );

    // Reopen
    isOpen = true;
    rerender(
      <ProductsFiltersSheet
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
        category="Bakery"
        status={STOCK_STATUS.IN_STOCK}
        sort={PRODUCT_SORT_KEY.SKU}
        dir={SORT_DIRECTION.ASC}
        categories={defaultCategories}
        activeFiltersCount={2}
        onApply={vi.fn()}
      />,
    );

    const handleApply = vi.fn();
    rerender(
      <ProductsFiltersSheet
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
        category="Bakery"
        status={STOCK_STATUS.IN_STOCK}
        sort={PRODUCT_SORT_KEY.SKU}
        dir={SORT_DIRECTION.ASC}
        categories={defaultCategories}
        activeFiltersCount={2}
        onApply={handleApply}
      />,
    );

    // Clicking Done now applies original values from props, proving discarded changes
    const doneButton = screen.getByRole("button", { name: "Done" });
    await user.click(doneButton);

    expect(handleApply).toHaveBeenCalledWith({
      category: "Bakery",
      status: STOCK_STATUS.IN_STOCK,
      sort: PRODUCT_SORT_KEY.SKU,
      dir: SORT_DIRECTION.ASC,
    });
  });
});

describe("ProductsToolbar onApply integration", () => {
  it("updates the URL with a single router.push and resets page to 1", async () => {
    mockPush.mockClear();
    mockSearchParams = new URLSearchParams("page=3&store=subang&q=blend");

    render(
      <ProductsToolbar
        search="blend"
        categories={defaultCategories}
        totalResults={10}
        onSearchChange={vi.fn()}
        onCategoryChange={vi.fn()}
        onStatusChange={vi.fn()}
      />,
    );

    const filterTrigger = screen.getByRole("button", { name: "Filters" });
    await userEvent.click(filterTrigger);

    const doneButton = screen.getByRole("button", { name: "Done" });
    await userEvent.click(doneButton);

    expect(mockPush).toHaveBeenCalledTimes(1);
    const pushedUrl: string = mockPush.mock.calls[0][0];
    expect(pushedUrl).toContain("store=subang");
    expect(pushedUrl).toContain("q=blend");
    expect(pushedUrl).not.toContain("page=3");
  });
});
