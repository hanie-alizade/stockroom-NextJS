"use client";

import { useEffect, useRef, type ReactElement } from "react";
import Link from "next/link";
import { CheckCircleIcon, WarningIcon } from "@/components/icons";
import { Banner } from "@/components/common";
import { Button, buttonVariants } from "@/components/ui/button";
import { downloadImportSkipped } from "@/helpers";
import type { ImportCommitResult } from "@/types";
import type { WizardFileInfo } from "@/hooks";
import { ImportResultStats } from "./ImportResultStats";

export interface DoneStepProps {
  result: ImportCommitResult;
  storeId: string;
  storeName: string;
  file: WizardFileInfo;
  onImportAnother: () => void;
  className?: string;
}

export function DoneStep({
  result,
  storeId,
  storeName,
  file,
  onImportAnother,
  className,
}: DoneStepProps): ReactElement {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const appliedCount = result.created + result.updated;
  const isAllSkipped = appliedCount + result.unchanged === 0 && result.skipped > 0;
  const isNothingApplied = appliedCount === 0;

  let title = "Import complete";
  let description = `${appliedCount} ${appliedCount === 1 ? "product" : "products"} applied to ${storeName}.`;

  if (isAllSkipped) {
    title = "Nothing was imported";
    description = "Every row was skipped. Download the skipped rows, fix them and try again.";
  }

  const handleDownloadSkipped = (): void => {
    downloadImportSkipped(file.name, file.headers, file.rows, result.skippedRows);
  };

  const announcement = `Import complete. ${result.created} created, ${result.updated} updated, ${result.unchanged} unchanged, ${result.skipped} skipped.`;

  return (
    <div className={className ?? "mx-auto flex w-full max-w-[1128px] flex-col gap-xl"}>
      {/* Live Region for Screen Readers */}
      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>

      {/* Header Block */}
      <div className="flex items-start gap-lg">
        <div
          className={`flex size-12 shrink-0 items-center justify-center rounded-full ${
            isNothingApplied
              ? "bg-status-warn-bg text-status-warn-fg"
              : "bg-status-ok-bg text-status-ok-fg"
          }`}
        >
          {isNothingApplied ? (
            <WarningIcon className="size-6" />
          ) : (
            <CheckCircleIcon className="size-6" />
          )}
        </div>

        <div className="flex flex-col">
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-page-title text-text-primary outline-none"
          >
            {title}
          </h2>
          <p className="text-body text-text-secondary mt-1">{description}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <ImportResultStats result={result} />

      {/* Skipped Rows Banner */}
      {result.skipped > 0 && (
        <Banner
          variant="warn"
          title={`${result.skipped} ${
            result.skipped === 1 ? "row was skipped" : "rows were skipped"
          }`}
          description="Download them, fix the problems and upload the file again."
          actionText="Download skipped rows (CSV)"
          onAction={handleDownloadSkipped}
        />
      )}

      {/* Action Buttons */}
      <div className="flex flex-col-reverse items-stretch gap-md sm:flex-row sm:items-center">
        <Button
          type="button"
          variant="secondary"
          onClick={onImportAnother}
          className="h-9 w-full sm:w-auto"
        >
          Import another file
        </Button>

        <Link
          href={`/products?store=${storeId}`}
          className={`${buttonVariants({
            variant: "default",
          })} h-9 w-full sm:w-auto text-center`}
        >
          View products in {storeName}
        </Link>
      </div>
    </div>
  );
}
