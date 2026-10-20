import { useMemo, type ReactElement } from "react";
import { cn } from "@/helpers";
import type { ImportField } from "@/types";
import type { WizardMapping } from "@/hooks";
import { MappingRow } from "./MappingRow";

export interface MappingTableProps {
  headers: readonly string[];
  rows: readonly Record<string, string>[];
  mapping: WizardMapping;
  mappedFieldToCol: ReadonlyMap<ImportField, string>;
  onMappingChange: (column: string, field: ImportField | null) => void;
  className?: string;
}

function getColumnSampleText(
  column: string,
  rows: readonly Record<string, string>[],
): string {
  const uniqueSamples: string[] = [];
  for (const r of rows) {
    const val = r[column]?.trim();
    if (val && !uniqueSamples.includes(val)) {
      uniqueSamples.push(val);
      if (uniqueSamples.length === 3) break;
    }
  }
  return uniqueSamples.length > 0 ? uniqueSamples.join(", ") : "—";
}

export function MappingTable({
  headers,
  rows,
  mapping,
  mappedFieldToCol,
  onMappingChange,
  className,
}: MappingTableProps): ReactElement {
  const samplesByColumn = useMemo(() => {
    const map = new Map<string, string>();
    for (const col of headers) {
      map.set(col, getColumnSampleText(col, rows));
    }
    return map;
  }, [headers, rows]);

  return (
    <div className={cn("w-full flex-1", className)}>
      {/* Desktop Table View */}
      <div className="hidden md:block relative rounded-lg border border-border-default bg-bg-surface overflow-hidden">
        <table className="w-full table-fixed text-left">
          <thead>
            <tr className="h-10 bg-bg-subtle border-b border-border-default">
              <th
                scope="col"
                className="w-[240px] pl-xl pr-lg text-label text-text-secondary font-medium"
              >
                Column in your file
              </th>
              <th
                scope="col"
                className="px-lg text-label text-text-secondary font-medium"
              >
                Sample values
              </th>
              <th
                scope="col"
                className="w-[240px] px-lg text-label text-text-secondary font-medium"
              >
                Maps to
              </th>
              <th scope="col" className="w-[176px] px-lg">
                <span className="sr-only">Status</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {headers.map((col, index) => {
              const entry = mapping[col] ?? { field: null, source: "manual" };
              const sampleText = samplesByColumn.get(col) ?? "—";
              const isLast = index === headers.length - 1;

              return (
                <MappingRow
                  key={col}
                  column={col}
                  sampleText={sampleText}
                  mappingEntry={entry}
                  mappedFieldToCol={mappedFieldToCol}
                  onMappingChange={onMappingChange}
                  isLast={isLast}
                  isMobile={false}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card View */}
      <div className="md:hidden flex flex-col gap-3">
        {headers.map((col) => {
          const entry = mapping[col] ?? { field: null, source: "manual" };
          const sampleText = samplesByColumn.get(col) ?? "—";

          return (
            <MappingRow
              key={col}
              column={col}
              sampleText={sampleText}
              mappingEntry={entry}
              mappedFieldToCol={mappedFieldToCol}
              onMappingChange={onMappingChange}
              isMobile={true}
            />
          );
        })}
      </div>
    </div>
  );
}
