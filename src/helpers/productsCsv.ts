import { STOCK_STATUS_LABEL } from "@/constants";
import type { CsvColumn } from "./csv";
import type { ProductListItem } from "@/types";

export function formatUnitCostCsv(sen: number): string {
  const isNegative = sen < 0;
  const absSen = Math.abs(Math.trunc(sen));
  const dollars = Math.floor(absSen / 100);
  const cents = absSen % 100;
  const formatted = `${dollars}.${String(cents).padStart(2, "0")}`;
  return isNegative ? `-${formatted}` : formatted;
}

export const productCsvColumns: CsvColumn<ProductListItem>[] = [
  { header: "SKU", accessor: (r) => r.sku },
  { header: "Name", accessor: (r) => r.name },
  { header: "Category", accessor: (r) => r.category },
  { header: "Status", accessor: (r) => STOCK_STATUS_LABEL[r.status] },
  { header: "On hand", accessor: (r) => r.onHand },
  { header: "Reorder level", accessor: (r) => r.reorderLevel },
  { header: "Unit cost", accessor: (r) => formatUnitCostCsv(r.unitCostSen) },
];
