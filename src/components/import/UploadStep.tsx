import type { ReactElement } from "react";
import { cn } from "@/helpers";
import type { Store } from "@/types";
import type { WizardFileInfo } from "@/hooks";
import { FileDropzone } from "./FileDropzone";
import { FileSummaryCard } from "./FileSummaryCard";
import { StoreField } from "./StoreField";
import { UploadGuide } from "./UploadGuide";

export interface UploadStepProps {
  file: WizardFileInfo | null;
  storeId: string;
  stores: readonly Store[];
  onFileLoaded: (fileInfo: WizardFileInfo) => void;
  onReplaceFile: () => void;
  onStoreChange: (storeId: string) => void;
  className?: string;
}

export function UploadStep({
  file,
  storeId,
  stores,
  onFileLoaded,
  onReplaceFile,
  onStoreChange,
  className,
}: UploadStepProps): ReactElement {
  const currentStore = stores.find((s) => s.id === storeId);
  const storeName = currentStore ? currentStore.name : storeId;

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-2xl lg:grid-cols-[minmax(0,1fr)_360px]",
        className,
      )}
    >
      {/* Left Column */}
      <div className="flex flex-col">
        {file ? (
          <FileSummaryCard
            fileName={file.name}
            rowCount={file.rowCount}
            columnCount={file.headers.length}
            sizeBytes={file.size}
            storeName={storeName}
            onReplaceFile={onReplaceFile}
          />
        ) : (
          <FileDropzone onFileLoaded={onFileLoaded} />
        )}

        <StoreField
          storeId={storeId}
          stores={stores}
          onStoreChange={onStoreChange}
        />
      </div>

      {/* Right Column: Guide card */}
      <div>
        <UploadGuide />
      </div>
    </div>
  );
}
