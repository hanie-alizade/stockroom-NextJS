import type { ReactElement } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IMPORT_FIELD,
  IMPORT_FIELD_LABEL,
  IMPORT_REQUIRED_FIELDS,
} from "@/constants";
import { cn } from "@/helpers";
import type { ImportField } from "@/types";
import type { ColumnMappingEntry } from "@/hooks";
import { MappingStatusPill, type MappingStatus } from "./MappingStatusPill";

export interface MappingRowProps {
  column: string;
  sampleText: string;
  mappingEntry: ColumnMappingEntry;
  mappedFieldToCol: ReadonlyMap<ImportField, string>;
  onMappingChange: (column: string, field: ImportField | null) => void;
  isLast?: boolean;
  isMobile?: boolean;
}

const NONE_VALUE = "__none__";

export function MappingRow({
  column,
  sampleText,
  mappingEntry,
  mappedFieldToCol,
  onMappingChange,
  isLast = false,
  isMobile = false,
}: MappingRowProps): ReactElement {
  const currentField = mappingEntry.field;

  let status: MappingStatus = "skipped";
  if (currentField) {
    status = mappingEntry.source === "auto" ? "matched" : "manual";
  }

  const handleValueChange = (val: string) => {
    if (val === NONE_VALUE) {
      onMappingChange(column, null);
    } else {
      onMappingChange(column, val as ImportField);
    }
  };

  const selectTriggerClass = cn(
    "h-9",
    isMobile ? "w-full" : "w-[216px]",
    !currentField && "text-text-tertiary",
  );

  const selectElement = (
    <Select
      value={currentField ?? NONE_VALUE}
      onValueChange={handleValueChange}
    >
      <SelectTrigger className={selectTriggerClass} aria-label={`Map column ${column}`}>
        <SelectValue placeholder="Don't import">
          {currentField ? IMPORT_FIELD_LABEL[currentField] : "Don't import"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {IMPORT_REQUIRED_FIELDS.map((field) => {
          const usedByCol = mappedFieldToCol.get(field);
          const isUsedByOther = usedByCol !== undefined && usedByCol !== column;

          return (
            <SelectItem
              key={field}
              value={field}
              disabled={isUsedByOther}
            >
              {IMPORT_FIELD_LABEL[field]}
            </SelectItem>
          );
        })}
        <SelectItem value={NONE_VALUE}>Don&apos;t import</SelectItem>
      </SelectContent>
    </Select>
  );

  if (isMobile) {
    return (
      <div className="rounded-lg border border-border-default bg-bg-surface p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-mono-strong text-text-primary truncate" title={column}>
            {column}
          </span>
          <MappingStatusPill status={status} />
        </div>

        <div className="text-body-small text-text-tertiary line-clamp-2">
          <span className="font-medium text-text-secondary mr-1">Samples:</span>
          <span>{sampleText}</span>
        </div>

        <div>{selectElement}</div>
      </div>
    );
  }

  return (
    <tr
      className={cn(
        "h-14 border-b border-border-default hover:bg-bg-subtle/50 transition-colors",
        isLast && "border-b-0",
      )}
    >
      {/* Column in your file */}
      <td className="w-[240px] pl-xl pr-lg">
        <span className="text-mono-strong text-text-primary block truncate" title={column}>
          {column}
        </span>
      </td>

      {/* Sample values */}
      <td className="px-lg max-w-0">
        <span className="text-body-small text-text-tertiary block truncate" title={sampleText}>
          {sampleText}
        </span>
      </td>

      {/* Maps to */}
      <td className="w-[240px] px-lg">{selectElement}</td>

      {/* Status pill */}
      <td className="w-[176px] px-lg">
        <MappingStatusPill status={status} />
      </td>
    </tr>
  );
}
