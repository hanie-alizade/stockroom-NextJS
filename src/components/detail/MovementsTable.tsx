import type { ReactElement } from "react";
import { formatDateTime, cn } from "@/helpers";
import { ArrowDownIcon } from "@/components/icons";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { MovementTypePill } from "./MovementTypePill";
import type { Movement, Store } from "@/types";

export interface MovementsTableProps {
  items: Movement[];
  stores: Store[];
  isLoading: boolean;
  isFetching?: boolean;
}

export function MovementsTable({
  items,
  stores,
  isLoading,
  isFetching,
}: MovementsTableProps): ReactElement {
  const storeMap = new Map(stores.map((s) => [s.id, s.name]));

  return (
    <div className="w-full overflow-x-auto">
      <table
        aria-busy={isFetching ?? isLoading}
        className="w-full min-w-[900px] border-collapse text-left"
      >
        <thead>
          <tr className="bg-bg-subtle border-border-default h-10 border-b">
            <th
              scope="col"
              aria-sort="descending"
              className="pl-xl px-md text-label text-text-primary w-[185px] text-left font-medium"
            >
              <div className="gap-xs flex items-center">
                <span>Date & time</span>
                <ArrowDownIcon className="text-text-primary size-3.5" />
              </div>
            </th>
            <th
              scope="col"
              className="px-md text-label text-text-secondary w-[143px] text-left font-medium"
            >
              Type
            </th>
            <th
              scope="col"
              className="px-md text-label text-text-secondary w-[182px] text-left font-medium"
            >
              Store
            </th>
            <th
              scope="col"
              className="px-md text-label text-text-secondary w-[100px] text-right font-medium"
            >
              Change
            </th>
            <th
              scope="col"
              className="px-md text-label text-text-secondary w-[100px] text-right font-medium"
            >
              Balance
            </th>
            <th
              scope="col"
              className="px-md text-label text-text-secondary w-[180px] text-left font-medium"
            >
              By
            </th>
            <th scope="col" className="px-md text-label text-text-secondary text-left font-medium">
              Note
            </th>
          </tr>
        </thead>
        <tbody>
          {isLoading &&
            Array.from({ length: 9 }).map((_, i) => (
              <tr key={i} className="border-border-default h-12 border-b">
                <td className="pl-xl px-md w-[185px]">
                  <Skeleton className="h-4 w-24 rounded-xs" />
                </td>
                <td className="px-md w-[143px]">
                  <Skeleton className="h-5 w-20 rounded-full" />
                </td>
                <td className="px-md w-[182px]">
                  <Skeleton className="h-4 w-28 rounded-xs" />
                </td>
                <td className="px-md w-[100px] text-right">
                  <Skeleton className="ml-auto h-4 w-10 rounded-xs" />
                </td>
                <td className="px-md w-[100px] text-right">
                  <Skeleton className="ml-auto h-4 w-10 rounded-xs" />
                </td>
                <td className="px-md w-[180px]">
                  <div className="gap-sm flex items-center">
                    <Skeleton className="size-7 shrink-0 rounded-full" />
                    <Skeleton className="h-4 w-20 rounded-xs" />
                  </div>
                </td>
                <td className="px-md">
                  <Skeleton className="h-4 w-32 rounded-xs" />
                </td>
              </tr>
            ))}

          {!isLoading &&
            items.map((m) => {
              const storeName = storeMap.get(m.storeId) ?? m.storeId;
              let storeText = storeName;
              if (m.type === "transfer_out" && m.counterpartStoreId) {
                const counterpartName = storeMap.get(m.counterpartStoreId) ?? m.counterpartStoreId;
                storeText = `${storeName} \u2192 ${counterpartName}`;
              } else if (m.type === "transfer_in" && m.counterpartStoreId) {
                const counterpartName = storeMap.get(m.counterpartStoreId) ?? m.counterpartStoreId;
                storeText = `${storeName} \u2190 ${counterpartName}`;
              }

              const isPositive = m.quantity > 0;
              const isNegative = m.quantity < 0;
              let changeText = "0";
              if (isNegative) {
                changeText = `\u2212${Math.abs(m.quantity)}`;
              } else if (isPositive) {
                changeText = `+${m.quantity}`;
              }

              return (
                <tr key={m.id} className="border-border-default h-12 border-b">
                  <td className="pl-xl px-md text-body-small text-text-secondary w-[185px] whitespace-nowrap">
                    {formatDateTime(m.createdAt)}
                  </td>
                  <td className="px-md w-[143px]">
                    <MovementTypePill type={m.type} />
                  </td>
                  <td className="px-md text-body text-text-primary w-[182px] truncate">
                    {storeText}
                  </td>
                  <td
                    className={cn(
                      "px-md text-mono w-[100px] text-right font-normal",
                      isNegative && "text-status-danger-fg",
                      isPositive && "text-status-ok-fg",
                      !isNegative && !isPositive && "text-text-secondary",
                    )}
                  >
                    {changeText}
                  </td>
                  <td className="px-md text-mono text-text-secondary w-[100px] text-right">
                    {m.balanceAfter}
                  </td>
                  <td className="px-md w-[180px]">
                    <div className="gap-sm flex items-center">
                      <Avatar className="size-7">
                        <AvatarFallback className="bg-accent-subtle text-accent-default text-caption font-medium">
                          {m.by.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-body text-text-primary truncate">{m.by.name}</span>
                    </div>
                  </td>
                  <td className="px-md text-body-small text-text-tertiary">
                    {m.note ? (
                      m.note
                    ) : (
                      <span className="text-text-disabled" aria-hidden="true">
                        &mdash;
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
