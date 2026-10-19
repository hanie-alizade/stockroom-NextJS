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
    <div className="overflow-x-auto w-full">
      <table
        aria-busy={isFetching ?? isLoading}
        className="w-full min-w-[900px] border-collapse text-left"
      >
        <thead>
          <tr className="bg-bg-subtle border-border-default h-10 border-b">
            <th
              scope="col"
              aria-sort="descending"
              className="w-[185px] pl-xl px-md text-left text-label text-text-primary font-medium sticky left-0 z-10 bg-bg-subtle border-r border-border-default shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]"
            >
              <div className="flex items-center gap-xs">
                <span>Date & time</span>
                <ArrowDownIcon className="size-3.5 text-text-primary" />
              </div>
            </th>
            <th scope="col" className="w-[143px] px-md text-left text-label text-text-secondary font-medium">
              Type
            </th>
            <th scope="col" className="w-[182px] px-md text-left text-label text-text-secondary font-medium">
              Store
            </th>
            <th scope="col" className="w-[100px] px-md text-right text-label text-text-secondary font-medium">
              Change
            </th>
            <th scope="col" className="w-[100px] px-md text-right text-label text-text-secondary font-medium">
              Balance
            </th>
            <th scope="col" className="w-[180px] px-md text-left text-label text-text-secondary font-medium">
              By
            </th>
            <th scope="col" className="px-md text-left text-label text-text-secondary font-medium">
              Note
            </th>
          </tr>
        </thead>
        <tbody>
          {isLoading &&
            Array.from({ length: 9 }).map((_, i) => (
              <tr key={i} className="h-12 border-b border-border-default">
                <td className="w-[185px] pl-xl px-md sticky left-0 z-10 bg-bg-surface border-r border-border-default shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                  <Skeleton className="h-4 w-24 rounded-xs" />
                </td>
                <td className="w-[143px] px-md">
                  <Skeleton className="h-5 w-20 rounded-full" />
                </td>
                <td className="w-[182px] px-md">
                  <Skeleton className="h-4 w-28 rounded-xs" />
                </td>
                <td className="w-[100px] px-md text-right">
                  <Skeleton className="h-4 w-10 ml-auto rounded-xs" />
                </td>
                <td className="w-[100px] px-md text-right">
                  <Skeleton className="h-4 w-10 ml-auto rounded-xs" />
                </td>
                <td className="w-[180px] px-md">
                  <div className="flex items-center gap-sm">
                    <Skeleton className="size-7 rounded-full shrink-0" />
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
                <tr key={m.id} className="h-12 border-b border-border-default">
                  <td className="w-[185px] pl-xl px-md text-body-small text-text-secondary whitespace-nowrap sticky left-0 z-10 bg-bg-surface border-r border-border-default shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                    {formatDateTime(m.createdAt)}
                  </td>
                  <td className="w-[143px] px-md">
                    <MovementTypePill type={m.type} />
                  </td>
                  <td className="w-[182px] px-md text-body text-text-primary truncate">
                    {storeText}
                  </td>
                  <td
                    className={cn(
                      "w-[100px] px-md text-right text-mono font-normal",
                      isNegative && "text-status-danger-fg",
                      isPositive && "text-status-ok-fg",
                      !isNegative && !isPositive && "text-text-secondary",
                    )}
                  >
                    {changeText}
                  </td>
                  <td className="w-[100px] px-md text-right text-mono text-text-secondary">
                    {m.balanceAfter}
                  </td>
                  <td className="w-[180px] px-md">
                    <div className="flex items-center gap-sm">
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
