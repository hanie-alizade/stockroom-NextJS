"use client";

import { useMemo, useState, useSyncExternalStore, type ReactElement } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ALL_STORES } from "@/constants";
import { formatChartDay, formatDay } from "@/helpers";
import { useQueryStockHistory } from "@/apiHooks";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import { StockChartTooltip } from "./StockChartTooltip";
import type { StockHistoryPoint, StoreScope } from "@/types";

export interface StockChartProps {
  productId: string;
  store: StoreScope;
  storeName?: string;
  reorderLevel: number;
  fail?: string;
}

type RangeOption = "7d" | "30d" | "90d";

const DAYS_BY_RANGE: Record<RangeOption, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const emptySubscribe = () => () => {};

export function StockChart({
  productId,
  store,
  storeName,
  reorderLevel: initialReorderLevel,
  fail,
}: StockChartProps): ReactElement {
  const [range, setRange] = useState<RangeOption>("30d");
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const days = DAYS_BY_RANGE[range];

  const { data, isLoading, isFetching, isError, refetch } = useQueryStockHistory(productId, {
    store,
    days,
    fail,
  });

  const points = useMemo(() => data?.points ?? [], [data?.points]);
  const reorderLevel = data?.reorderLevel ?? initialReorderLevel;

  const subtitle =
    store === ALL_STORES
      ? "All stores combined · reorder level is the sum of store levels"
      : (storeName ?? "Selected store");

  const xTicks = useMemo(() => {
    if (points.length >= 4) {
      return [
        points[0].date,
        points[Math.round((points.length - 1) / 3)].date,
        points[Math.round(((points.length - 1) * 2) / 3)].date,
        points[points.length - 1].date,
      ];
    }
    return points.map((p) => p.date);
  }, [points]);

  const ariaLabel = useMemo(() => {
    if (points.length === 0) return "No stock history available";
    if (points.length === 1) {
      return `Stock history: 1 data point, ${points[0].onHand} on hand on ${formatDay(points[0].date)}`;
    }
    const first = points[0];
    const last = points[points.length - 1];
    let minPoint = points[0];
    for (const p of points) {
      if (p.onHand < minPoint.onHand) minPoint = p;
    }
    return `Stock history: starting at ${first.onHand} on hand on ${formatDay(first.date)}, ending at ${last.onHand} on hand on ${formatChartDay(last.date)}, lowest was ${minPoint.onHand} on ${formatDay(minPoint.date)}`;
  }, [points]);

  let chartBody: ReactElement;

  if (!isMounted || (isLoading && !data)) {
    chartBody = <Skeleton className="h-[200px] w-full rounded-md" />;
  } else if (isError) {
    chartBody = (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <h3 className="text-body-strong text-text-primary">We couldn&apos;t load this chart</h3>
        <p className="text-body-small text-text-secondary mt-1">Your data is safe.</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="border-border-default bg-bg-surface hover:bg-bg-subtle text-text-primary text-label mt-3 inline-flex h-8 cursor-pointer items-center justify-center rounded-md border px-3"
        >
          Try again
        </button>
      </div>
    );
  } else if (points.length === 0) {
    chartBody = (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <h3 className="text-body-strong text-text-primary">No stock history yet</h3>
      </div>
    );
  } else {
    chartBody = (
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart
          accessibilityLayer
          data={points}
          margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
        >
          <CartesianGrid vertical={false} stroke="var(--border-default)" />
          <YAxis
            width={32}
            axisLine={false}
            tickLine={false}
            tickCount={4}
            allowDecimals={false}
            domain={[0, (dataMax: number) => Math.max(dataMax, reorderLevel)]}
            tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
          />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            ticks={xTicks}
            tick={({ x, y, payload, index }) => {
              const isFirst = index === 0;
              const isLast = index === (xTicks.length - 1);
              let anchor: "start" | "end" | "middle" = "middle";
              if (isFirst) {
                anchor = "start";
              } else if (isLast) {
                anchor = "end";
              }
              return (
                <text x={x} y={y} textAnchor={anchor} fill="var(--text-tertiary)" fontSize={11}>
                  {isLast ? "Today" : formatChartDay(payload.value)}
                </text>
              );
            }}
          />
          <Tooltip
            content={<StockChartTooltip />}
            offset={8}
            cursor={{ stroke: "var(--border-strong)", strokeDasharray: "4 4" }}
          />
          <ReferenceLine
            y={reorderLevel}
            stroke="var(--status-warn-fg)"
            strokeDasharray="4 4"
            strokeWidth={1.5}
          />
          <Area
            type="linear"
            dataKey="onHand"
            stroke="var(--accent-default)"
            strokeWidth={1.5}
            fill="var(--accent-subtle)"
            dot={
              points.length === 1
                ? {
                    r: 4,
                    fill: "var(--bg-surface)",
                    stroke: "var(--accent-default)",
                    strokeWidth: 2,
                  }
                : false
            }
            activeDot={{
              r: 4,
              fill: "var(--bg-surface)",
              stroke: "var(--accent-default)",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <div className="bg-bg-surface border-border-default shadow-card rounded-lg border p-xl flex flex-col">
      <div className="flex h-10 items-center justify-between">
        <div>
          <h2 className="text-card text-text-primary">On hand, last {days} days</h2>
          <p className="text-caption text-text-tertiary mt-2xs">{subtitle}</p>
        </div>
        <ToggleGroup
          type="single"
          value={range}
          onValueChange={(val) => {
            if (val) setRange(val as RangeOption);
          }}
          className="bg-bg-muted h-8 w-[152px] rounded-md p-[3px] flex items-center justify-between border-0 gap-0"
        >
          <ToggleGroupItem
            value="7d"
            className="text-label text-text-secondary data-[state=on]:bg-bg-surface data-[state=on]:text-text-primary data-[state=on]:shadow-card h-[26px] min-w-[48px] rounded-md border-0 p-0 transition-all hover:text-text-primary"
          >
            7d
          </ToggleGroupItem>
          <ToggleGroupItem
            value="30d"
            className="text-label text-text-secondary data-[state=on]:bg-bg-surface data-[state=on]:text-text-primary data-[state=on]:shadow-card h-[26px] min-w-[48px] rounded-md border-0 p-0 transition-all hover:text-text-primary"
          >
            30d
          </ToggleGroupItem>
          <ToggleGroupItem
            value="90d"
            className="text-label text-text-secondary data-[state=on]:bg-bg-surface data-[state=on]:text-text-primary data-[state=on]:shadow-card h-[26px] min-w-[48px] rounded-md border-0 p-0 transition-all hover:text-text-primary"
          >
            90d
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div
        className="mt-lg h-[200px]"
        role="img"
        aria-label={ariaLabel}
        aria-busy={isFetching}
      >
        {chartBody}
      </div>

      {points.length === 1 && !isLoading && !isError && (
        <p className="text-caption text-text-tertiary mt-2 text-center">
          Only 1 data point so far
        </p>
      )}

      <div className="mt-md flex items-center gap-lg text-caption text-text-secondary">
        <div className="flex items-center gap-sm">
          <span className="inline-block h-[2px] w-4 bg-[var(--accent-default)]" />
          <span>On hand</span>
        </div>
        <div className="flex items-center gap-sm">
          <span className="inline-block w-4 border-b-[1.5px] border-dashed border-[var(--status-warn-fg)]" />
          <span>Reorder level ({reorderLevel})</span>
        </div>
      </div>
    </div>
  );
}
