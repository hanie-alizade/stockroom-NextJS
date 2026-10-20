import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useRef, type ReactElement } from "react";
import {
  ROLE,
  STOCK_STATUS,
  queryKeys,
} from "@/constants";
import type {
  Adjustment,
  AdjustmentResult,
  ProductListItem,
  Role,
} from "@/types";
import type { AdjustStoreOption } from "@/helpers";
import { AdjustStockDialog } from "../AdjustStockDialog";
import { ProductsTableRow } from "@/components/products/ProductsTableRow";
import { useIdempotencyKey } from "@/hooks";
import { useMutationAdjustment } from "@/apiHooks";

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockSearchParams = new URLSearchParams();

const { mockPostAdjustment } = vi.hoisted(() => ({
  mockPostAdjustment: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => "/products",
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@/api/productsApi", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    postAdjustment: mockPostAdjustment,
  };
});

vi.mock("@/api", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    postAdjustment: mockPostAdjustment,
  };
});

beforeAll(() => {
  if (typeof window !== "undefined") {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    window.HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
    window.HTMLElement.prototype.setPointerCapture = vi.fn();
    window.HTMLElement.prototype.releasePointerCapture = vi.fn();
  }
  if (typeof window.ResizeObserver === "undefined") {
    window.ResizeObserver = class {
      observe(): void { }
      unobserve(): void { }
      disconnect(): void { }
    };
  }
});

const mockProduct = {
  id: "prod-1",
  sku: "KL-001",
  name: "Espresso Roast",
};

const mockStores: AdjustStoreOption[] = [
  { storeId: "store-1", storeName: "Uptown Branch", onHand: 15, reorderLevel: 5 },
  { storeId: "store-2", storeName: "Downtown Branch", onHand: 8, reorderLevel: 5 },
  { storeId: "store-3", storeName: "Airport Kiosk", onHand: 0, reorderLevel: 3 },
];

const mockProductListItem: ProductListItem = {
  id: "prod-1",
  sku: "KL-001",
  name: "Espresso Roast",
  category: "Coffee",
  supplier: "Kopi Supply Co",
  unitCostSen: 1200,
  onHand: 23,
  reorderLevel: 10,
  status: STOCK_STATUS.IN_STOCK,
  updatedAt: "2026-03-01T00:00:00.000Z",
};

const mockSuccessResult: AdjustmentResult = {
  movements: [],
  stock: [{ storeId: "store-1", onHand: 25 }],
};

function createTestQueryClient(): QueryClient {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  client.setQueryData(queryKeys.meta.all, {
    categories: [{ name: "Coffee" }, { name: "Bakery" }],
    stores: [
      { id: "store-1", name: "Uptown Branch", code: "UB" },
      { id: "store-2", name: "Downtown Branch", code: "DB" },
      { id: "store-3", name: "Airport Kiosk", code: "AK" },
    ],
  });
  return client;
}

interface TestHarnessProps {
  initialRole?: Role;
  initialStoreId?: string;
}

function TestAdjustHarness({
  initialRole = ROLE.MANAGER,
  initialStoreId = "store-1",
}: TestHarnessProps): ReactElement {
  const [open, setOpen] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);
  const idempotencyKey = useIdempotencyKey();
  const adjustMutation = useMutationAdjustment(mockProduct.id);

  const handleSubmit = async (payload: Adjustment): Promise<void> => {
    if (isSubmittingRef.current || adjustMutation.isPending) return;
    isSubmittingRef.current = true;
    setServerError(null);
    const key = idempotencyKey.getKey(payload);

    try {
      await adjustMutation.mutateAsync({ payload, idempotencyKey: key });
      idempotencyKey.onSuccess();
      setOpen(false);
    } catch (err: unknown) {
      idempotencyKey.onError(err);
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError("Failed to adjust");
      }
    } finally {
      isSubmittingRef.current = false;
    }
  };

  return (
    <AdjustStockDialog
      open={open}
      onOpenChange={setOpen}
      product={mockProduct}
      stores={mockStores}
      initialStoreId={initialStoreId}
      user={{ name: "Alex Chen", role: initialRole }}
      isSaving={adjustMutation.isPending}
      serverError={serverError}
      onSubmit={handleSubmit}
    />
  );
}

function RowActionsHarness(): ReactElement {
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductListItem | null>(null);

  return (
    <div>
      <table>
        <tbody>
          <ProductsTableRow
            item={mockProductListItem}
            isSelected={false}
            storeParam="all"
            now={new Date("2026-03-01T12:00:00Z")}
            onSelect={vi.fn()}
            onRowClick={vi.fn()}
            onAdjust={(prod) => {
              setSelectedProduct(prod);
              setAdjustOpen(true);
            }}
          />
        </tbody>
      </table>
      {selectedProduct && (
        <AdjustStockDialog
          open={adjustOpen}
          onOpenChange={setAdjustOpen}
          product={selectedProduct}
          stores={mockStores}
          initialStoreId="store-1"
          user={{ name: "Alex Chen", role: ROLE.MANAGER }}
          isSaving={false}
          serverError={null}
          onSubmit={vi.fn()}
        />
      )}
    </div>
  );
}

describe("AdjustStockDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. Write-off without a reason shows the reason error and does not call the API", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(
      <AdjustStockDialog
        open={true}
        onOpenChange={vi.fn()}
        product={mockProduct}
        stores={mockStores}
        initialStoreId="store-1"
        user={{ name: "Alex Chen", role: ROLE.MANAGER }}
        isSaving={false}
        serverError={null}
        onSubmit={handleSubmit}
      />,
    );

    const writeOffRadio = screen.getByRole("radio", { name: "Write-off" });
    await user.click(writeOffRadio);

    const qtyInput = screen.getByLabelText("Quantity");
    await user.clear(qtyInput);
    await user.type(qtyInput, "3");

    const reasonInput = screen.getByLabelText("Reason");
    await user.click(reasonInput);
    await user.tab();

    expect(screen.getByText("Enter a reason (at least 3 characters).")).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: "Write off 3 units" });
    expect(submitBtn).toBeDisabled();

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(mockPostAdjustment).not.toHaveBeenCalled();
  });

  it("2. Quantity 0, -1 and 1.5 show the whole-number-above-zero error", async () => {
    const user = userEvent.setup();

    render(
      <AdjustStockDialog
        open={true}
        onOpenChange={vi.fn()}
        product={mockProduct}
        stores={mockStores}
        initialStoreId="store-1"
        user={{ name: "Alex Chen", role: ROLE.MANAGER }}
        isSaving={false}
        serverError={null}
        onSubmit={vi.fn()}
      />,
    );

    const qtyInput = screen.getByLabelText("Quantity");

    // Case "0": should show error above 0
    await user.clear(qtyInput);
    await user.type(qtyInput, "0");
    await user.tab();
    expect(screen.getByText("Enter a number above 0.")).toBeInTheDocument();

    // Case "-1": should show error above 0
    await user.clear(qtyInput);
    await user.type(qtyInput, "-1");
    await user.tab();
    expect(screen.getByText("Enter a number above 0.")).toBeInTheDocument();

    // Case "1.5": should show whole number error
    await user.clear(qtyInput);
    await user.type(qtyInput, "1.5");
    await user.tab();
    expect(screen.getByText("Enter a whole number.")).toBeInTheDocument();
  });

  it("3. Staff: Write-off and Transfer have aria-disabled='true'; Receive and Sell do not", () => {
    render(
      <AdjustStockDialog
        open={true}
        onOpenChange={vi.fn()}
        product={mockProduct}
        stores={mockStores}
        initialStoreId="store-1"
        user={{ name: "Sam Staff", role: ROLE.STAFF }}
        isSaving={false}
        serverError={null}
        onSubmit={vi.fn()}
      />,
    );

    const writeOffRadio = screen.getByRole("radio", { name: "Write-off" });
    const transferRadio = screen.getByRole("radio", { name: "Transfer" });
    const receiveRadio = screen.getByRole("radio", { name: "Receive" });
    const sellRadio = screen.getByRole("radio", { name: "Sell" });

    expect(writeOffRadio).toHaveAttribute("aria-disabled", "true");
    expect(transferRadio).toHaveAttribute("aria-disabled", "true");
    expect(receiveRadio).not.toHaveAttribute("aria-disabled");
    expect(sellRadio).not.toHaveAttribute("aria-disabled");
  });

  it("4. Transfer: the From store is removed from the To list", async () => {
    const user = userEvent.setup();

    render(
      <AdjustStockDialog
        open={true}
        onOpenChange={vi.fn()}
        product={mockProduct}
        stores={mockStores}
        initialStoreId="store-1"
        user={{ name: "Alex Chen", role: ROLE.MANAGER }}
        isSaving={false}
        serverError={null}
        onSubmit={vi.fn()}
      />,
    );

    const transferRadio = screen.getByRole("radio", { name: "Transfer" });
    await user.click(transferRadio);

    // Initial From store is Uptown Branch ("store-1")
    const toSelectTrigger = screen.getByRole("combobox", { name: "To" });
    await user.click(toSelectTrigger);

    // Uptown Branch must not be in the To store options list
    expect(
      screen.queryByRole("option", { name: /Uptown Branch/i }),
    ).not.toBeInTheDocument();

    // Other stores should be in the To options list
    expect(
      screen.getByRole("option", { name: /Downtown Branch/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /Airport Kiosk/i }),
    ).toBeInTheDocument();
  });

  it("5. Double click on Save calls postAdjustment once; a retry after a network error reuses the same Idempotency-Key; an edit changes the key", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    let rejectNetworkError: ((err: Error) => void) | null = null;
    mockPostAdjustment.mockImplementationOnce(() => {
      return new Promise<AdjustmentResult>((_resolve, reject) => {
        rejectNetworkError = reject;
      });
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TestAdjustHarness initialStoreId="store-1" />
      </QueryClientProvider>,
    );

    const qtyInput = screen.getByLabelText("Quantity");
    await user.clear(qtyInput);
    await user.type(qtyInput, "10");

    const saveButton = screen.getByRole("button", { name: "Receive 10 units" });

    // Double click on Save
    await user.dblClick(saveButton);

    // Only called once due to isSubmittingRef / isPending guard
    expect(mockPostAdjustment).toHaveBeenCalledTimes(1);
    const firstKey = mockPostAdjustment.mock.calls[0][2];
    expect(firstKey).toBeTruthy();

    // Trigger network failure
    rejectNetworkError!(new Error("Network Error"));

    // Server error message appears and dialog remains open
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Network Error");
    });

    // Retry after network error (retaining key)
    mockPostAdjustment.mockRejectedValueOnce(new Error("Another Network Error"));
    const retrySaveButton = screen.getByRole("button", { name: "Receive 10 units" });
    await user.click(retrySaveButton);

    await waitFor(() => {
      expect(mockPostAdjustment).toHaveBeenCalledTimes(2);
    });

    const secondKey = mockPostAdjustment.mock.calls[1][2];
    expect(secondKey).toBe(firstKey);

    // Edit changes the key: user modifies quantity from 10 to 15
    await user.clear(qtyInput);
    await user.type(qtyInput, "15");

    mockPostAdjustment.mockResolvedValueOnce(mockSuccessResult);
    const saveEditedButton = screen.getByRole("button", { name: "Receive 15 units" });
    await user.click(saveEditedButton);

    await waitFor(() => {
      expect(mockPostAdjustment).toHaveBeenCalledTimes(3);
    });
    const thirdKey = mockPostAdjustment.mock.calls[2][2];
    expect(thirdKey).not.toBe(firstKey);
  });

  it("6. Server INSUFFICIENT_STOCK keeps the dialog open, keeps typed values and shows the message", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    mockPostAdjustment.mockRejectedValueOnce(
      new Error("INSUFFICIENT_STOCK: Only 5 units available."),
    );

    render(
      <QueryClientProvider client={queryClient}>
        <TestAdjustHarness initialStoreId="store-1" />
      </QueryClientProvider>,
    );

    const qtyInput = screen.getByLabelText("Quantity");
    await user.clear(qtyInput);
    await user.type(qtyInput, "10");

    const saveButton = screen.getByRole("button", { name: "Receive 10 units" });
    await user.click(saveButton);

    // Server error message is displayed
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "INSUFFICIENT_STOCK: Only 5 units available.",
      );
    });

    // Dialog stays open
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Adjust stock" })).toBeInTheDocument();

    // Typed values are preserved
    expect(qtyInput).toHaveValue("10");
  });

  it("7. The row actions menu opens the dialog and returns focus to its trigger", async () => {
    const user = userEvent.setup();

    render(<RowActionsHarness />);

    const trigger = screen.getByRole("button", {
      name: `Actions for ${mockProductListItem.name}`,
    });
    expect(trigger).toBeInTheDocument();

    // Click row action menu button
    await user.click(trigger);

    // Click "Adjust stock" menu item
    const adjustMenuItem = await screen.findByRole("menuitem", { name: "Adjust stock" });
    await user.click(adjustMenuItem);

    // AdjustStockDialog is opened
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Adjust stock" })).toBeInTheDocument();

    // Close the dialog using Cancel
    const cancelBtn = screen.getByRole("button", { name: "Cancel" });
    await user.click(cancelBtn);

    // Dialog closes
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    // Focus returns to the trigger
    expect(trigger).toHaveFocus();
  });
});
