import type { ReactElement } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/helpers";

export type ReviewTabValue = "all" | "errors" | "ready";

export interface ReviewTabsProps {
  activeTab: ReviewTabValue;
  onTabChange: (tab: ReviewTabValue) => void;
  totalCount: number;
  errorsCount: number;
  readyCount: number;
  disabled?: boolean;
  className?: string;
}

export function ReviewTabs({
  activeTab,
  onTabChange,
  totalCount,
  errorsCount,
  readyCount,
  disabled = false,
  className,
}: ReviewTabsProps): ReactElement {
  const tabs: { value: ReviewTabValue; label: string; count: number }[] = [
    { value: "all", label: "All rows", count: totalCount },
    { value: "errors", label: "Errors", count: errorsCount },
    { value: "ready", label: "Ready", count: readyCount },
  ];

  return (
    <Tabs
      value={activeTab}
      onValueChange={(val) => {
        if (!disabled) onTabChange(val as ReviewTabValue);
      }}
      className={cn("w-full flex-col gap-0", className)}
    >
      <TabsList
        variant="line"
        className="border-border-default h-10 w-full justify-start gap-2xl rounded-none border-b p-0 overflow-x-auto"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              disabled={disabled}
              className="text-body-strong data-[state=active]:text-text-primary text-text-tertiary hover:text-text-secondary data-[state=active]:after:bg-accent-default gap-sm rounded-none border-b-0 px-0 after:bottom-[-1px] data-[state=active]:after:h-[2px]"
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "text-caption inline-flex h-[18px] min-w-[28px] items-center justify-center rounded-full px-[6px] font-normal",
                  isActive
                    ? "bg-accent-subtle text-accent-default"
                    : "bg-bg-muted text-text-tertiary",
                )}
              >
                {tab.count}
              </span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
