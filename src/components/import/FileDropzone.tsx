"use client";

import { useRef, useState, type DragEvent, type ChangeEvent, type ReactElement } from "react";
import { CircleAlertIcon, UploadIcon } from "@/components/icons";
import { cn, parseCsv } from "@/helpers";
import { IMPORT_LIMITS } from "@/constants";
import type { WizardFileInfo } from "@/hooks";

export interface FileDropzoneProps {
  onFileLoaded: (fileInfo: WizardFileInfo) => void;
  disabled?: boolean;
  className?: string;
}

export function FileDropzone({
  onFileLoaded,
  disabled = false,
  className,
}: FileDropzoneProps): ReactElement {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setErrorMessage(null);

    // 1. Check extension / MIME type
    const isCsvName = file.name.toLowerCase().endsWith(".csv");
    if (!isCsvName && !file.type.includes("csv") && file.type !== "text/plain") {
      setErrorMessage("Only CSV files are supported.");
      return;
    }

    // 2. Check file size <= 5 MB
    if (file.size > IMPORT_LIMITS.maxFileBytes) {
      setErrorMessage("This file is over 5 MB. Split it and try again.");
      return;
    }

    setIsLoading(true);

    try {
      let text = "";
      if (typeof file.text === "function") {
        text = await file.text();
      } else {
        text = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsText(file);
        });
      }

      if (!text || !text.trim()) {
        setErrorMessage(
          "We couldn't read this file. Check that the first row has column names.",
        );
        setIsLoading(false);
        return;
      }

      const { headers, rows, rowCount } = parseCsv(text);

      if (headers.length === 0) {
        setErrorMessage(
          "We couldn't read this file. Check that the first row has column names.",
        );
        setIsLoading(false);
        return;
      }

      if (rowCount === 0) {
        setErrorMessage("This file has no data rows.");
        setIsLoading(false);
        return;
      }

      if (rowCount > IMPORT_LIMITS.maxRows) {
        setErrorMessage("This file has more than 2,000 rows.");
        setIsLoading(false);
        return;
      }

      onFileLoaded({
        file,
        name: file.name,
        size: file.size,
        headers,
        rows,
        rowCount,
      });
    } catch {
      setErrorMessage(
        "We couldn't read this file. Check that the first row has column names.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled || isLoading) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || isLoading) return;

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      void processFile(droppedFile);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      void processFile(selectedFile);
    }
    // Reset so same file can be re-selected if needed
    e.target.value = "";
  };

  const triggerBrowse = () => {
    if (!disabled && !isLoading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={triggerBrowse}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            triggerBrowse();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-describedby={errorMessage ? "dropzone-error" : undefined}
        aria-disabled={disabled || isLoading}
        className={cn(
          "min-h-[336px] w-full cursor-pointer rounded-lg border border-dashed p-6",
          "flex flex-col items-center justify-center text-center transition-colors",
          "outline-none focus-visible:ring-[3px] focus-visible:ring-accent-default/30",
          isDragOver
            ? "border-accent-default bg-accent-subtle"
            : "border-border-strong bg-bg-surface hover:bg-bg-subtle",
          (disabled || isLoading) && "pointer-events-none opacity-60",
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />

        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-accent-subtle text-accent-default">
          <UploadIcon className="size-6" />
        </div>

        {isLoading ? (
          <p className="text-body-strong text-text-primary animate-pulse">
            Reading file…
          </p>
        ) : (
          <>
            <p className="text-body-strong text-text-primary mb-1">
              Drop a CSV file here
            </p>
            <p className="text-body-small text-text-tertiary mb-2">
              or{" "}
              <span className="text-label text-text-link hover:underline font-medium">
                choose a file
              </span>
            </p>
            <p className="text-caption text-text-tertiary">
              CSV only · up to 5 MB · 2,000 rows max
            </p>
          </>
        )}
      </div>

      {errorMessage && (
        <div
          id="dropzone-error"
          role="alert"
          className="text-body-small text-status-danger-fg mt-2 flex items-center gap-1.5"
        >
          <CircleAlertIcon className="size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
