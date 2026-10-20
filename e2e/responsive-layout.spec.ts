import { test, expect } from "@playwright/test";
import { resetData, switchUser } from "./helpers";

test.describe("Responsive layout and mobile drawer", () => {
  test.beforeEach(async ({ request, context }) => {
    await resetData(request);
    await switchUser(context, "aina-rahman");
  });

  const overflowTestCases = [
    { name: "Products list", path: "/products" },
    { name: "Product detail overview", path: "/products/KL-1002" },
    { name: "Product detail movements", path: "/products/KL-1002?tab=movements" },
    { name: "Import", path: "/import" },
  ];

  const viewports = [375, 768, 1100];

  for (const tc of overflowTestCases) {
    for (const width of viewports) {
      test(`no horizontal page overflow on ${tc.name} at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(tc.path);

        // Wait for main content to be visible
        await expect(page.locator("main")).toBeVisible();

        const { scrollWidth, clientWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));

        expect(scrollWidth).toBe(clientWidth);
      });
    }
  }

  const drawerWidths = [375, 640, 768, 900, 1023];

  for (const width of drawerWidths) {
    test(`mobile navigation drawer has correct width at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/products");

      const menuButton = page.getByRole("button", { name: "Open navigation menu" });
      await expect(menuButton).toBeVisible();
      await menuButton.click();

      const drawer = page.getByRole("dialog", { name: "Navigation menu" });
      await expect(drawer).toBeVisible();

      const box = await drawer.boundingBox();
      expect(box).not.toBeNull();

      if (width < 376) {
        // Below 376px: 85vw of 375 is 318.75px (~319px)
        const expectedWidth = Math.round(width * 0.85);
        expect(box!.width).toBeGreaterThanOrEqual(expectedWidth - 2);
        expect(box!.width).toBeLessThanOrEqual(320);
      } else {
        // From 376px and above: capped at 320px
        expect(Math.round(box!.width)).toBe(320);
      }
    });
  }
});
