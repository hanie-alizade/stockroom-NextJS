import type { ReactElement } from "react";
import type { TooltipProps } from "recharts";
import { formatDay } from "@/helpers";
import type { StockHistoryPoint } from "@/types";

export function StockChartTooltip({
  active,
  payload,
}: TooltipProps<number, string>): ReactElement | null {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const point = payload[0]?.payload as StockHistoryPoint | undefined;
  if (!point) {
    return null;
  }

  return (
    <div className="bg-bg-overlay text-text-on-accent shadow-popover rounded-md px-md py-sm">
      <div className="text-caption">{formatDay(point.date)}</div>
      <div className="text-label mt-0.5">{point.onHand} on hand</div>
    </div>
  );
}
