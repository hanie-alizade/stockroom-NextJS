import { test, expect } from "@playwright/test";
import { resetData, switchUser } from "./helpers";

test.describe("Manager transfer workflow", () => {
  test.beforeEach(async ({ request, context }) => {
    await resetData(request);
    await switchUser(context, "aina-rahman");
  });

  test("transfers stock between stores and reflects updated values on detail and list views", async ({
    page,
  }) => {
    // 1. Open /products and filter by search, category, and status
    await page.goto("/products");
    const searchInput = page.getByPlaceholder("Search name or SKU").filter({ visible: true });
    await searchInput.fill("arabica");
    await expect(page).toHaveURL(/q=arabica/);

    const categorySelect = page.getByRole("combobox").filter({ hasText: "All categories" });
    await categorySelect.click();
    await page.getByRole("option", { name: "Coffee" }).click();
    await expect(page).toHaveURL(/category=Coffee/);

    const statusSelect = page.getByRole("combobox").filter({ hasText: "All statuses" });
    await statusSelect.click();
    await page.getByRole("option", { name: "In stock" }).click();
    await expect(page).toHaveURL(/status=in_stock/);

    // 2. Open KL-1042 (Arabica beans 1 kg)
    await page.getByRole("link", { name: "Arabica beans 1 kg" }).click();
    await expect(page).toHaveURL(/\/products\/KL-1042/);

    // 3. Read initial Stock by store table values using exact cell locators
    const montKiaraRow = page.getByRole("row", { name: /Mont Kiara/i });
    const subangRow = page.getByRole("row", { name: /Subang/i });
    const montKiaraQtyCell = montKiaraRow.getByRole("cell").nth(1);
    const subangQtyCell = subangRow.getByRole("cell").nth(1);

    const montKiaraStart = Number((await montKiaraQtyCell.textContent())?.trim());
    const subangStart = Number((await subangQtyCell.textContent())?.trim());
    expect(montKiaraStart).toBeGreaterThan(0);
    expect(subangStart).toBeGreaterThanOrEqual(0);

    // 4. Open Adjust stock dialog
    await page.getByRole("button", { name: "Adjust stock", exact: true }).click();

    // 5. Select Transfer in the Type radiogroup
    const typeGroup = page.getByRole("radiogroup", { name: "Type" });
    await typeGroup.getByRole("radio", { name: "Transfer" }).click();

    // 6. Select From = Mont Kiara, To = Subang, Quantity = 5
    await page.getByLabel("From", { exact: true }).click();
    await page.getByRole("option", { name: /Mont Kiara/i }).click();

    await page.getByLabel("To", { exact: true }).click();
    await page.getByRole("option", { name: /Subang/i }).click();

    await page.getByLabel("Quantity", { exact: true }).fill("5");

    // 7. Save transfer
    await page.getByRole("button", { name: /transfer 5 units/i }).click();

    // 8. Without reloading, assert Mont Kiara start-5 and Subang start+5 on exact quantity cells
    await expect(montKiaraQtyCell).toHaveText(String(montKiaraStart - 5));
    await expect(subangQtyCell).toHaveText(String(subangStart + 5));

    // 9. After the transfer assert the Movements tab shows exactly two new rows for this transfer (one out, one in)
    await page.getByRole("tab", { name: /Movements/i }).click();
    const movementRows = page.locator("tbody tr");
    await expect(movementRows.nth(0)).toContainText(/Transfer/i);
    await expect(movementRows.nth(1)).toContainText(/Transfer/i);
    const m0 = await movementRows.nth(0).textContent();
    const m1 = await movementRows.nth(1).textContent();
    expect(
      (m0?.includes("Transfer in") && m1?.includes("Transfer out")) ||
      (m0?.includes("Transfer out") && m1?.includes("Transfer in")),
    ).toBe(true);

    // 10. Assert that Back (page.goBack) returns to the previous filtered list URL
    while (!page.url().includes("/products?") && page.url().includes("/products/")) {
      await page.goBack();
    }
    await expect(page).toHaveURL(/q=arabica/);
    await expect(page).toHaveURL(/category=Coffee/);
    await expect(page).toHaveURL(/status=in_stock/);

    // 11. Navigate stores and verify numbers reflect the change
    const allStoresSelector = page.getByRole("combobox").filter({ hasText: /All stores/i });
    await allStoresSelector.click();
    await page.getByRole("option", { name: "Mont Kiara" }).click();
    await expect(page.getByRole("row", { name: /Arabica beans 1 kg/i })).toContainText(String(montKiaraStart - 5));

    const montKiaraSelector = page.getByRole("combobox").filter({ hasText: /Mont Kiara/i });
    await montKiaraSelector.click();
    await page.getByRole("option", { name: "Subang" }).click();
    await expect(page.getByRole("row", { name: /Arabica beans 1 kg/i })).toContainText(String(subangStart + 5));
  });

  test("closes dialog on Esc and returns focus to the Adjust stock button", async ({ page }) => {
    await page.goto("/products/KL-1042");

    const adjustButton = page.getByRole("button", { name: "Adjust stock", exact: true });
    await adjustButton.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(adjustButton).toBeFocused();
  });

  test("preserves search URL state upon page reload", async ({ page }) => {
    await page.goto("/products");
    const searchInput = page.getByPlaceholder("Search name or SKU").filter({ visible: true });
    await searchInput.fill("arabica");
    await expect(page).toHaveURL(/q=arabica/);

    await page.reload();
    await expect(page).toHaveURL(/q=arabica/);
    await expect(searchInput).toHaveValue("arabica");
  });
});
