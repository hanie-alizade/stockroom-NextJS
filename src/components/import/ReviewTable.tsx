"use client";

import { useState, type ReactElement } from "react";
import { CheckCircleIcon, CircleAlertIcon } from "@/components/icons";
import { Pagination } from "@/components/common";
import { DEFAULT_PAGE_SIZE, IMPORT_ACTION, IMPORT_FIELD } from "@/constants";
import { cn } from "@/helpers";
import type { ImportField, ImportRowResult, PageSize } from "@/types";

export interface ReviewTableProps {
  rows: ImportRowResult[];
  className?: string;
}

function renderCellContent(
  field: ImportField,
  value: string | undefined,
  hasError: boolean,
  alignRight?: boolean,
): ReactElement {
  const trimmed = value?.trim();

  if (hasError) {
    return (
      <span
        className={cn(
          "inline-flex h-5 items-center rounded-sm bg-status-danger-bg px-sm text-mono text-status-danger-fg",
          alignRight && "ml-auto",
        )}
      >
        {trimmed || "empty"}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "truncate block text-text-primary",
        field === IMPORT_FIELD.NAME ? "text-body-strong" : "",
        field === IMPORT_FIELD.CATEGORY ? "text-body-small text-text-secondary" : "",
        field === IMPORT_FIELD.SKU || field === IMPORT_FIELD.QUANTITY || field === IMPORT_FIELD.UNIT_COST
          ? "text-mono"
          : "",
      )}
    >
      {trimmed ?? ""}
    </span>
  );
}

export function ReviewTable({ rows, className }: ReviewTableProps): ReactElement {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);

  const startIndex = (page - 1) * pageSize;
  const paginatedRows = rows.slice(startIndex, startIndex + pageSize);

  return (
    <div
      className={cn(
        "rounded-lg border border-border-default bg-bg-surface overflow-x-auto",
        className,
      )}
    >
      <table className="w-full min-w-[900px] border-collapse text-left">
        <thead>
          <tr className="h-10 border-b border-border-default bg-bg-subtle text-label text-text-secondary">
            <th scope="col" className="w-[72px] px-lg text-right font-medium">
              Row
            </th>
            <th scope="col" className="w-[120px] px-lg text-left font-medium">
              SKU
            </th>
            <th scope="col" className="px-lg text-left font-medium">
              Name
            </th>
            <th scope="col" className="w-[150px] px-lg text-left font-medium">
              Category
            </th>
            <th scope="col" className="w-[90px] px-lg text-right font-medium">
              Qty
            </th>
            <th scope="col" className="w-[110px] px-lg text-right font-medium">
              Unit cost
            </th>
            <th scope="col" className="w-[320px] px-lg text-left font-medium">
              Problem
            </th>
          </tr>
        </thead>
        <tbody>
          {paginatedRows.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="h-24 text-center text-body text-text-tertiary"
              >
                No rows to display.
              </td>
            </tr>
          ) : (
            paginatedRows.map((row) => {
              const fieldErrorSet = new Set(row.errors.map((e) => e.field));
              const skuError = fieldErrorSet.has(IMPORT_FIELD.SKU);
              const nameError = fieldErrorSet.has(IMPORT_FIELD.NAME);
              const categoryError = fieldErrorSet.has(IMPORT_FIELD.CATEGORY);
              const qtyError = fieldErrorSet.has(IMPORT_FIELD.QUANTITY);
              const costError = fieldErrorSet.has(IMPORT_FIELD.UNIT_COST);

              const hasErrors = row.errors.length > 0;
              const firstError = row.errors[0];
              const moreErrorsCount = row.errors.length - 1;

              return (
                <tr
                  key={row.rowNumber}
                  className="h-12 border-b border-border-default last:border-b-0 hover:bg-bg-subtle/50 transition-colors"
                >
                  <td className="w-[72px] px-lg text-right text-mono text-text-tertiary">
                    {row.rowNumber}
                  </td>
                  <td className="w-[120px] px-lg">
                    {renderCellContent(IMPORT_FIELD.SKU, row.values.sku, skuError)}
                  </td>
                  <td className="px-lg">
                    {renderCellContent(IMPORT_FIELD.NAME, row.values.name, nameError)}
                  </td>
                  <td className="w-[150px] px-lg text-left">
                    {renderCellContent(
                      IMPORT_FIELD.CATEGORY,
                      row.values.category,
                      categoryError,
                    )}
                  </td>
                  <td className="w-[90px] px-lg text-right">
                    {renderCellContent(
                      IMPORT_FIELD.QUANTITY,
                      row.values.quantity,
                      qtyError,
                      true,
                    )}
                  </td>
                  <td className="w-[110px] px-lg text-right">
                    {renderCellContent(
                      IMPORT_FIELD.UNIT_COST,
                      row.values.unitCost,
                      costError,
                      true,
                    )}
                  </td>
                  <td className="w-[320px] px-lg">
                    {hasErrors ? (
                      <div className="flex items-center gap-1.5 text-body-small text-status-danger-fg">
                        <CircleAlertIcon className="size-4 shrink-0 text-status-danger-fg" />
                        <span className="truncate">{firstError?.message}</span>
                        {moreErrorsCount > 0 && (
                          <span className="shrink-0 text-text-tertiary">
                            +{moreErrorsCount} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-body-small text-status-ok-fg">
                        <CheckCircleIcon className="size-4 shrink-0 text-status-ok-fg" />
                        <span>
                          {row.action === IMPORT_ACTION.CREATE
                            ? "Will create"
                            : "Will update"}
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {rows.length > pageSize && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={rows.length}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
        />
      )}
    </div>
  );
}
