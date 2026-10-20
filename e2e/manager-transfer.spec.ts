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
    // 1. Open /products and search "arabica"
    await page.goto("/products");
    const searchInput = page.getByPlaceholder("Search name or SKU").filter({ visible: true });
    await searchInput.fill("arabica");
    await expect(page).toHaveURL(/q=arabica/);

    // 2. Open KL-1042 (Arabica beans 1 kg)
    await page.getByRole("link", { name: "Arabica beans 1 kg" }).click();
    await expect(page).toHaveURL(/\/products\/KL-1042/);

    // 3. Read initial Stock by store table values (Mont Kiara: 18, Subang: 4)
    const montKiaraRow = page.getByRole("row", { name: /Mont Kiara/i });
    const subangRow = page.getByRole("row", { name: /Subang/i });
    await expect(montKiaraRow).toContainText("18");
    await expect(subangRow).toContainText("4");

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

    // 8. Without reloading, assert Mont Kiara -5 (13) and Subang +5 (9) in the table
    await expect(montKiaraRow).toContainText("13");
    await expect(subangRow).toContainText("9");

    // 9. Navigate back to list and assert numbers reflect the change when viewing each store
    await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Products" }).click();
    await expect(page).toHaveURL(/\/products/);

    // Check Mont Kiara stock in list
    const allStoresSelector = page.getByRole("combobox").filter({ hasText: /All stores/i });
    await allStoresSelector.click();
    await page.getByRole("option", { name: "Mont Kiara" }).click();
    await expect(page.getByRole("row", { name: /Arabica beans 1 kg/i })).toContainText("13");

    // Check Subang stock in list
    const montKiaraSelector = page.getByRole("combobox").filter({ hasText: /Mont Kiara/i });
    await montKiaraSelector.click();
    await page.getByRole("option", { name: "Subang" }).click();
    await expect(page.getByRole("row", { name: /Arabica beans 1 kg/i })).toContainText("9");
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
