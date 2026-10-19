import type { ReactElement } from "react";
import { CheckCircleIcon, CircleAlertIcon } from "@/components/icons";
import { Banner } from "@/components/common";
import { IMPORT_FIELD_LABEL } from "@/constants";
import { cn } from "@/helpers";
import type { ImportField } from "@/types";
import type { WizardFileInfo, WizardMapping } from "@/hooks";
import { FileSummaryCard } from "./FileSummaryCard";
import { MappingTable } from "./MappingTable";

export interface MapColumnsStepProps {
  file: WizardFileInfo;
  storeName: string;
  mapping: WizardMapping;
  mappedFieldToCol: ReadonlyMap<ImportField, string>;
  unmappedColumns: readonly string[];
  missingRequiredFields: readonly ImportField[];
  allRequiredMapped: boolean;
  onReplaceFile: () => void;
  onMappingChange: (column: string, field: ImportField | null) => void;
  className?: string;
}

function formatUnmappedDescription(columns: readonly string[]): string {
  if (columns.length === 1) {
    return `${columns[0]} isn't a field in Stockroom, so it'll be skipped. That's fine.`;
  }
  const last = columns[columns.length - 1];
  const rest = columns.slice(0, -1).join(", ");
  return `${rest} and ${last} aren't fields in Stockroom, so they'll be skipped. That's fine.`;
}

export function MapColumnsStep({
  file,
  storeName,
  mapping,
  mappedFieldToCol,
  unmappedColumns,
  missingRequiredFields,
  allRequiredMapped,
  onReplaceFile,
  onMappingChange,
  className,
}: MapColumnsStepProps): ReactElement {
  const missingFieldLabels = missingRequiredFields.map(
    (field) => IMPORT_FIELD_LABEL[field],
  );

  return (
    <div className={cn("flex flex-col flex-1", className)}>
      {/* File summary */}
      <FileSummaryCard
        fileName={file.name}
        rowCount={file.rowCount}
        columnCount={file.headers.length}
        sizeBytes={file.size}
        storeName={storeName}
        onReplaceFile={onReplaceFile}
      />

      {/* Unmapped columns banner */}
      {unmappedColumns.length > 0 && (
        <div className="mt-5">
          <Banner
            variant="warn"
            title={`${unmappedColumns.length} ${
              unmappedColumns.length === 1
                ? "column won't be imported"
                : "columns won't be imported"
            }`}
            description={formatUnmappedDescription(unmappedColumns)}
          />
        </div>
      )}

      {/* Mapping table card */}
      <div className="mt-5 flex-1">
        <MappingTable
          headers={file.headers}
          rows={file.rows}
          mapping={mapping}
          mappedFieldToCol={mappedFieldToCol}
          onMappingChange={onMappingChange}
        />
      </div>

      {/* Status line */}
      <div className="mt-3">
        {allRequiredMapped ? (
          <div
            role="status"
            className="flex items-center gap-1.5 text-body-small text-status-ok-fg font-medium"
          >
            <CheckCircleIcon className="size-4 shrink-0" />
            <span>All 5 required fields are mapped.</span>
          </div>
        ) : (
          <div
            role="status"
            className="flex items-center gap-1.5 text-body-small text-status-danger-fg font-medium"
          >
            <CircleAlertIcon className="size-4 shrink-0" />
            <span>{`Still to map: ${missingFieldLabels.join(", ")}.`}</span>
          </div>
        )}
      </div>
    </div>
  );
}
