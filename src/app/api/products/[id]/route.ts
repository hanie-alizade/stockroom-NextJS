import "server-only";

import { ALL_STORES } from "@/constants";
import { withApi } from "@/lib/server/http/with-api";
import { productDetailQuerySchema } from "@/schemas";
import { getProductDetail } from "@/lib/server/services/products";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } },
): Promise<Response> {
  return withApi(async ({ repo }) => {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const parsed = productDetailQuerySchema.parse(rawParams);
    const store = parsed.store ?? ALL_STORES;

    const result = await getProductDetail(repo, id, store);

    return result;
  });
}
