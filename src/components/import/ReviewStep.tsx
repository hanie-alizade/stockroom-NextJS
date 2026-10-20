"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import { useMutationValidateImport } from "@/apiHooks";
import { QueryErrorState } from "@/components/common";
import { Skeleton } from "@/components/ui/skeleton";
import { buildImportFormData, type WizardFileInfo, type WizardMapping } from "@/hooks";
import type { ImportValidationResult } from "@/types";
import { FileSummaryCard } from "./FileSummaryCard";
import { ReviewTable } from "./ReviewTable";
import { ReviewTabs, type ReviewTabValue } from "./ReviewTabs";

export interface ReviewStepProps {
  file: WizardFileInfo;
  storeId: string;
  storeName: string;
  mapping: WizardMapping;
  validationResult: ImportValidationResult | null;
  onValidated: (result: ImportValidationResult) => void;
  onReplaceFile: () => void;
  isCommitting?: boolean;
  commitError?: Error | null;
  onRetryCommit?: () => void;
  className?: string;
}

export function ReviewStep({
  file,
  storeId,
  storeName,
  mapping,
  validationResult,
  onValidated,
  onReplaceFile,
  isCommitting = false,
  commitError = null,
  onRetryCommit,
  className,
}: ReviewStepProps): ReactElement {
  const validateMutation = useMutationValidateImport();
  const triggeredKeyRef = useRef<string | null>(null);
  const currentKey = `${file.name}-${file.size}-${storeId}-${JSON.stringify(mapping)}`;

  useEffect(() => {
    if (!validationResult && triggeredKeyRef.current !== currentKey) {
      triggeredKeyRef.current = currentKey;
      const formData = buildImportFormData(file.file, storeId, mapping);
      validateMutation.mutate(formData, {
        onSuccess: (result) => {
          onValidated(result);
        },
      });
    }
  }, [currentKey, file, storeId, mapping, validationResult, validateMutation, onValidated]);

  const [selectedTab, setSelectedTab] = useState<ReviewTabValue | null>(null);
  const activeTab: ReviewTabValue =
    selectedTab ??
    (validationResult && validationResult.summary.invalid > 0 ? "errors" : "all");

  const handleRetry = (): void => {
    const formData = buildImportFormData(file.file, storeId, mapping);
    validateMutation.mutate(formData, {
      onSuccess: (result) => {
        onValidated(result);
      },
    });
  };

  if (validateMutation.isError && !validationResult) {
    return (
      <div className="flex flex-col gap-5">
        <FileSummaryCard
          fileName={file.name}
          rowCount={file.rowCount}
          columnCount={file.headers.length}
          sizeBytes={file.size}
          storeName={storeName}
          onReplaceFile={onReplaceFile}
        />
        <QueryErrorState
          variant="section"
          error={validateMutation.error}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  if (validateMutation.isPending || !validationResult) {
    return (
      <div className="flex flex-col gap-5">
        <FileSummaryCard
          fileName={file.name}
          rowCount={file.rowCount}
          columnCount={file.headers.length}
          sizeBytes={file.size}
          storeName={storeName}
          onReplaceFile={onReplaceFile}
        />
        <div className="rounded-lg border border-border-default bg-bg-surface overflow-hidden">
          <div className="h-10 border-b border-border-default bg-bg-subtle px-lg flex items-center">
            <Skeleton className="h-4 w-48" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-12 border-b border-border-default last:border-b-0 px-lg flex items-center gap-4"
            >
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { summary, rows } = validationResult;

  const displayedRows = rows.filter((row) => {
    if (activeTab === "errors") {
      return row.status === "invalid" || row.errors.length > 0;
    }
    if (activeTab === "ready") {
      return row.status === "valid" && row.errors.length === 0;
    }
    return true;
  });

  const announcement = `${summary.total} rows checked: ${summary.valid} ready, ${summary.invalid} with errors`;

  return (
    <div className={className ?? "flex flex-col gap-5"}>
      <div className="sr-only" aria-live="polite" role="status">
        {announcement}
      </div>

      {commitError && (
        <QueryErrorState
          variant="section"
          hasData
          error={commitError}
          onRetry={onRetryCommit}
        />
      )}

      <FileSummaryCard
        fileName={file.name}
        rowCount={file.rowCount}
        columnCount={file.headers.length}
        sizeBytes={file.size}
        storeName={storeName}
        onReplaceFile={onReplaceFile}
        showReviewBadges
        disabled={isCommitting}
        readyCount={summary.valid}
        errorsCount={summary.invalid}
      />

      <ReviewTabs
        activeTab={activeTab}
        onTabChange={setSelectedTab}
        disabled={isCommitting}
        totalCount={summary.total}
        errorsCount={summary.invalid}
        readyCount={summary.valid}
      />

      <ReviewTable rows={displayedRows} />
    </div>
  );
}
