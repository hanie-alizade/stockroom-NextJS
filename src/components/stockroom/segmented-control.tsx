import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LockIcon } from "@/components/icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Segment {
  value: string;
  label: string;
  locked?: boolean;
  lockedReason?: string;
}

interface SegmentedControlProps {
  segments: Segment[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function SegmentedControl({
  segments,
  value,
  onValueChange,
  disabled,
}: SegmentedControlProps): React.ReactElement {
  return (
    <TooltipProvider>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        className="bg-bg-muted p-xs gap-xs rounded-lg"
      >
        {segments.map((segment) => {
          const isSelected = value === segment.value;
          const isLocked = segment.locked;

          const content = (
            <ToggleGroupItem
              value={segment.value}
              disabled={isLocked}
              className={cn(
                "px-md py-sm text-body-small focus-ring rounded-md font-medium",
                isSelected
                  ? "bg-bg-surface text-text-primary shadow-card"
                  : "text-text-secondary hover:text-text-primary",
                isLocked && "cursor-not-allowed opacity-50",
              )}
              aria-disabled={isLocked}
            >
              {isLocked && <LockIcon className="mr-xs h-3 w-3" />}
              {segment.label}
            </ToggleGroupItem>
          );

          if (isLocked && segment.lockedReason) {
            return (
              <Tooltip key={segment.value}>
                <TooltipTrigger asChild>{content}</TooltipTrigger>
                <TooltipContent>
                  <p>{segment.lockedReason}</p>
                </TooltipContent>
              </Tooltip>
            );
          }

          return content;
        })}
      </ToggleGroup>
    </TooltipProvider>
  );
}
