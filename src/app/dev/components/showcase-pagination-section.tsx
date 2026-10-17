import { Pagination } from "@/components/stockroom/pagination";
import { useState } from "react";

export function PaginationShowcase(): React.ReactElement {
  const [paginationPage, setPaginationPage] = useState(1);
  const [paginationPageSize, setPaginationPageSize] = useState(25);

  return (
    <section>
      <h2 className="text-section text-text-primary mb-lg">Pagination</h2>
      <div className="max-w-2xl">
        <Pagination
          currentPage={paginationPage}
          pageSize={paginationPageSize}
          totalItems={250}
          onPageChange={setPaginationPage}
          onPageSizeChange={setPaginationPageSize}
        />
      </div>
    </section>
  );
}
