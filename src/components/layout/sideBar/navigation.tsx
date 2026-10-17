import { BoxIcon, UploadIcon, SupplierIcon, ReportIcon } from "@/components/icons";
import { NavItem } from "./navItem";

export function Navigation(): React.ReactElement {
  return (
    <nav className="flex flex-col gap-1">
      <span className="text-overline text-text-secondary mb-2">INVENTORY</span>

      <NavItem href="/" icon={BoxIcon} label="Products" active />

      <NavItem href="/import" icon={UploadIcon} label="Import" />

      <NavItem href="/suppliers" icon={SupplierIcon} label="Suppliers" disabled badgeText="Soon" />

      <NavItem href="/reports" icon={ReportIcon} label="Reports" disabled badgeText="Soon" />
    </nav>
  );
}
