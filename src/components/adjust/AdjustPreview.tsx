"use client";

import type { ReactElement } from "react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { STOCK_STATUS } from "@/constants";
import type { PreviewRow } from "@/helpers";

export interface AdjustPreviewProps {
  rows: PreviewRow[];
}

export function AdjustPreview({ rows }: AdjustPreviewProps): ReactElement | null {
  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-sm rounded-md border border-border-default bg-bg-subtle px-lg py-[14px]">
      <span className="text-caption text-text-tertiary">After this change</span>

      <div className="flex flex-col gap-sm">
        {rows.map((row) => (
          <div
            key={row.storeName}
            className="flex min-h-[22px] min-w-0 items-center justify-between gap-sm"
          >
            <span className="text-body-small text-text-primary min-w-0 truncate">{row.storeName}</span>

            <div className="flex shrink-0 items-center gap-sm">
              <span className="text-mono text-text-secondary whitespace-nowrap">
                {row.beforeOnHand} →{" "}
                <span
                  className={
                    row.afterOnHand !== null
                      ? "text-mono-strong text-text-primary"
                      : undefined
                  }
                >
                  {row.afterOnHand !== null ? row.afterOnHand : "–"}
                </span>
              </span>

              {row.showBadge && row.status && (
                <StatusBadge status={row.status} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
