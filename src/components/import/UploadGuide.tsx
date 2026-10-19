import type { ReactElement } from "react";
import { CheckIcon, DownloadIcon } from "@/components/icons";
import { cn } from "@/helpers";

const GUIDE_ITEMS = [
  "First row is the column header.",
  "Required: SKU, name, category, quantity, unit cost.",
  "Quantity is the new on-hand count, not a change.",
  "Unit cost in RM with a dot, e.g. 12.50.",
  "Category must already exist in Stockroom.",
  "A SKU that exists is updated. A new SKU is created.",
] as const;

export interface UploadGuideProps {
  className?: string;
}

export function UploadGuide({ className }: UploadGuideProps): ReactElement {
  return (
    <aside
      aria-label="Upload guide"
      className={cn(
        "rounded-lg border border-border-default bg-bg-surface p-xl flex flex-col",
        className,
      )}
    >
      <h2 className="text-card font-semibold text-text-primary mb-4">
        Before you upload
      </h2>

      <ul className="flex flex-col gap-md">
        {GUIDE_ITEMS.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <CheckIcon className="size-4 shrink-0 text-accent-default mt-0.5" />
            <span className="text-body-small text-text-secondary leading-normal">
              {item}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-6 pt-2">
        <a
          href="/stockroom-import-template.csv"
          download="stockroom-import-template.csv"
          className="text-label text-text-link hover:underline inline-flex items-center gap-1.5"
        >
          <DownloadIcon className="size-4 shrink-0" />
          <span>Download template (CSV)</span>
        </a>
      </div>
    </aside>
  );
}
