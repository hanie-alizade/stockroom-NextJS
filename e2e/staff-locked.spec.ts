import { test, expect } from "@playwright/test";
import { resetData, switchUser } from "./helpers";

test.describe("Staff permissions and restricted actions", () => {
  test.beforeEach(async ({ request, context }) => {
    await resetData(request);
    await switchUser(context, "faiz-hakim");
  });

  test("locks manager-only actions in UI and denies unauthorized API requests", async ({
    page,
  }) => {
    // 1. Open KL-1042 and open Adjust stock dialog
    await page.goto("/products/KL-1042");
    await page.getByRole("button", { name: "Adjust stock", exact: true }).click();

    // 2. Assert Write-off and Transfer radios have aria-disabled="true", Receive and Sell do not
    const typeGroup = page.getByRole("radiogroup", { name: "Type" });
    await expect(typeGroup.getByRole("radio", { name: "Write-off" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await expect(typeGroup.getByRole("radio", { name: "Transfer" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await expect(typeGroup.getByRole("radio", { name: "Receive" })).not.toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await expect(typeGroup.getByRole("radio", { name: "Sell" })).not.toHaveAttribute(
      "aria-disabled",
      "true",
    );

    // 3. Assert Import nav link is not visible in sidebar
    await expect(page.getByRole("link", { name: "Import" })).not.toBeVisible();

    // 4. Assert /import redirects to /products
    await page.goto("/import");
    await expect(page).toHaveURL(/\/products/);

    // 5. Assert page.request.post to adjustments endpoint with write_off returns 403
    const response = await page.request.post("/api/products/KL-1042/adjustments", {
      headers: {
        "content-type": "application/json",
        "idempotency-key": "e2e-staff-write-off",
      },
      data: {
        type: "write_off",
        storeId: "mont-kiara",
        quantity: 1,
        note: "Damaged box",
      },
    });

    expect(response.status()).toBe(403);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe("FORBIDDEN");
  });
});
