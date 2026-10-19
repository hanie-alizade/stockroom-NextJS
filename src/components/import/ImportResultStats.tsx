import type { ReactElement } from "react";
import { StatCard } from "@/components/common";
import type { ImportCommitResult } from "@/types";

export interface ImportResultStatsProps {
  result: ImportCommitResult;
  className?: string;
}

export function ImportResultStats({
  result,
  className,
}: ImportResultStatsProps): ReactElement {
  return (
    <div className={className ?? "grid grid-cols-2 gap-lg lg:grid-cols-4"}>
      <StatCard
        label="Created"
        value={result.created}
        subtitle="New products"
      />
      <StatCard
        label="Updated"
        value={result.updated}
        subtitle="Existing products changed"
      />
      <StatCard
        label="Unchanged"
        value={result.unchanged}
        subtitle="Already up to date"
      />
      <StatCard
        label="Skipped"
        value={result.skipped}
        subtitle="Rows with errors"
        variant={result.skipped > 0 ? "warn" : "default"}
      />
    </div>
  );
}
