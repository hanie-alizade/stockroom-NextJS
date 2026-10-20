import type { ReactElement } from "react";
import { ProductDetailSkeleton } from "@/components/detail";

export default function ProductDetailLoading(): ReactElement {
  return <ProductDetailSkeleton />;
}
