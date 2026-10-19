import { Skeleton } from "@/components/ui/skeleton";

export function ProductsTableSkeleton(): React.ReactElement {
  return (
    <>
      {Array.from({ length: 9 }).map((_, index) => (
        <tr
          key={index}
          className="border-border-default h-[52px] border-b"
        >
          <td className="w-[44px] min-w-[44px] max-w-[44px] px-md text-center align-middle sticky left-0 z-10 bg-bg-surface">
            <div className="inline-flex items-center">
              <Skeleton className="size-4 rounded-sm" />
            </div>
          </td>

          <td className="w-[100px] min-w-[100px] max-w-[100px] px-md align-middle whitespace-nowrap sticky left-[44px] z-10 bg-bg-surface">
            <Skeleton className="h-3 w-[70px] rounded-full" />
          </td>

          <td className="w-[220px] min-w-[220px] max-w-[220px] px-md align-middle sticky left-[144px] z-10 bg-bg-surface border-r border-border-default shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
            <Skeleton className="h-3 w-[218px] rounded-full" />
          </td>

          <td className="px-md align-middle whitespace-nowrap">
            <Skeleton className="h-3 w-[88px] rounded-full" />
          </td>

          <td className="px-md align-middle whitespace-nowrap">
            <Skeleton className="h-3 w-[58px] rounded-full" />
          </td>

          <td className="px-md align-middle whitespace-nowrap">
            <Skeleton className="h-3 w-[60px] rounded-full" />
          </td>

          <td className="px-md align-middle whitespace-nowrap">
            <Skeleton className="h-3 w-[83px] rounded-full" />
          </td>

          <td className="px-md align-middle whitespace-nowrap">
            <Skeleton className="h-3 w-[68px] rounded-full" />
          </td>

          <td className="px-md align-middle whitespace-nowrap">
            <Skeleton className="h-3 w-[68px] rounded-full" />
          </td>

          <td className="w-[44px] pr-md text-right align-middle" />
        </tr>
      ))}
    </>
  );
}
