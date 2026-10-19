import { useCallback, useState } from "react";
import { toast } from "sonner";
import { getProductList } from "@/api";
import { TIME_ZONE } from "@/constants";
import { buildCsv, downloadCsv, productCsvColumns } from "@/helpers";
import type { ProductListItem, ProductListQuery } from "@/types";

export function useProductsExport(query: ProductListQuery): {
  exportAll: () => Promise<void>;
  isExporting: boolean;
} {
  const [isExporting, setIsExporting] = useState(false);

  const exportAll = useCallback(async () => {
    if (isExporting) {
      return;
    }

    setIsExporting(true);
    try {
      const firstRes = await getProductList({
        ...query,
        page: 1,
        pageSize: 100,
      });

      const totalPages = Math.ceil(firstRes.total / 100);
      let allItems: ProductListItem[] = [...firstRes.items];

      if (totalPages > 1) {
        const remainingPages = Array.from({ length: totalPages - 1 }, (_, idx) => idx + 2);
        const remainingResponses = await Promise.all(
          remainingPages.map((page) =>
            getProductList({
              ...query,
              page,
              pageSize: 100,
            }),
          ),
        );
        for (const res of remainingResponses) {
          allItems = allItems.concat(res.items);
        }
      }

      const content = buildCsv(productCsvColumns, allItems);
      const dateStr = new Intl.DateTimeFormat("en-CA", {
        timeZone: TIME_ZONE,
      }).format(new Date());

      downloadCsv(`stockroom-products-${dateStr}.csv`, content);
    } catch {
      toast.error("We couldn't export products. Try again.");
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, query]);

  return {
    exportAll,
    isExporting,
  };
}
