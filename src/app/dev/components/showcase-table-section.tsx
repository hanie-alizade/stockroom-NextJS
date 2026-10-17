import { TableHeaderCell } from "@/components/stockroom/table-header-cell";
import { SkeletonRow } from "@/components/stockroom/skeleton-row";
import { useState } from "react";

export function TableShowcase(): React.ReactElement {
  const [sortDirection, setSortDirection] = useState<"none" | "asc" | "desc">("none");

  return (
    <>
      <section>
        <h2 className="text-section text-text-primary mb-lg">Table Header Cell</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <TableHeaderCell
                label="Name"
                sortable
                sortDirection={sortDirection}
                onSort={() => {
                  const directions: Array<"none" | "asc" | "desc"> = ["none", "asc", "desc"];
                  const currentIndex = directions.indexOf(sortDirection);
                  setSortDirection(directions[(currentIndex + 1) % 3]);
                }}
              />
              <TableHeaderCell label="SKU" />
              <TableHeaderCell label="Quantity" numeric sortable />
            </tr>
          </thead>
        </table>
      </section>

      <section>
        <h2 className="text-section text-text-primary mb-lg">Skeleton Row</h2>
        <table className="w-full border-collapse">
          <tbody>
            <SkeletonRow columnCount={4} columnWidths={["30%", "20%", "20%", "30%"]} />
            <SkeletonRow columnCount={4} columnWidths={["30%", "20%", "20%", "30%"]} />
            <SkeletonRow columnCount={4} columnWidths={["30%", "20%", "20%", "30%"]} />
          </tbody>
        </table>
      </section>
    </>
  );
}
