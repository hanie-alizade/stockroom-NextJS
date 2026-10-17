import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  sideOffset?: number;
}

export function TooltipWrapper({
  content,
  children,
  sideOffset = 8,
}: TooltipProps): React.ReactElement {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          sideOffset={sideOffset}
          className="bg-bg-overlay text-text-on-accent text-body-small px-md py-sm shadow-popover"
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
