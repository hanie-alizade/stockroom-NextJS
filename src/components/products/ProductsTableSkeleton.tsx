import { Skeleton } from "@/components/ui/skeleton";

export function ProductsTableSkeleton(): React.ReactElement {
  return (
    <>
      {Array.from({ length: 9 }).map((_, index) => (
        <tr
          key={index}
          className="border-border-default h-[52px] border-b"
        >
          <td className="w-[44px] px-md text-center align-middle">
            <div className="inline-flex items-center">
              <Skeleton className="size-4 rounded-sm" />
            </div>
          </td>

          <td className="px-md align-middle whitespace-nowrap">
            <Skeleton className="h-3 w-[70px] rounded-full" />
          </td>

          <td className="px-md align-middle">
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
