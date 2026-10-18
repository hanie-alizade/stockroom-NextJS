"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { BoxIcon, UploadIcon, SupplierIcon, ReportIcon } from "@/components/icons";
import { NavItem } from "./navItem";
import { useCan } from "@/providers";

export function Navigation(): React.ReactElement {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const canImport = useCan("import");

  const isProductsActive = pathname.startsWith("/products");
  const isImportActive = pathname === "/import";

  const currentStore = searchParams.get("store");
  const productsHref = currentStore ? `/products?store=${currentStore}` : "/products";

  const showImport = canImport;

  return (
    <nav className="flex flex-col gap-1">
      <span className="text-overline text-text-secondary mb-2">INVENTORY</span>

      <NavItem href={productsHref} icon={BoxIcon} label="Products" active={isProductsActive} />

      {showImport && (
        <NavItem href="/import" icon={UploadIcon} label="Import" active={isImportActive} />
      )}

      <NavItem href="/suppliers" icon={SupplierIcon} label="Suppliers" disabled badgeText="Soon" />

      <NavItem href="/reports" icon={ReportIcon} label="Reports" disabled badgeText="Soon" />
    </nav>
  );
}
