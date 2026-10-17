import { cn } from "@/lib/utils";
import { Tabs as ShadcnTabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Tab {
  value: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

export function Tabs({ tabs, value, onValueChange, children }: TabsProps): React.ReactElement {
  return (
    <ShadcnTabs value={value} onValueChange={onValueChange}>
      <TabsList className="border-border-default h-auto rounded-none border-b bg-transparent p-0">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={cn(
              "data-[state=active]:border-accent-default data-[state=active]:text-text-primary text-text-secondary px-md py-sm text-body focus-ring rounded-none border-b-2 border-transparent font-medium",
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-xs bg-bg-muted text-text-secondary text-caption px-xs rounded-full">
                {tab.count}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </ShadcnTabs>
  );
}

export { TabsContent };
