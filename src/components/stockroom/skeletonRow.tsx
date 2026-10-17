import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonRowProps {
  columnCount: number;
  columnWidths?: (string | number)[];
  className?: string;
}

export function SkeletonRow({
  columnCount,
  columnWidths,
  className,
}: SkeletonRowProps): React.ReactElement {
  return (
    <tr className={cn("border-border-default border-b", className)}>
      {Array.from({ length: columnCount }).map((_, index) => (
        <td
          key={index}
          className="px-md h-[52px]"
          style={columnWidths ? { width: columnWidths[index] } : undefined}
        >
          <Skeleton className="bg-bg-muted h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}
