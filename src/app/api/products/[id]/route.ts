import "server-only";

import { ALL_STORES } from "@/constants";
import { jsonResponse, parseQuery, withApi } from "@/server/http";
import type { RouteContext } from "@/server/http";
import { productDetailQuerySchema } from "@/schemas";
import { getProductDetail } from "@/server/services/products";

export async function GET(
  request: Request,
  { params }: RouteContext,
): Promise<Response> {
  return withApi(request, async ({ repo }) => {
    const { id } = await params;
    const parsed = parseQuery(request, productDetailQuerySchema);
    const store = parsed.store ?? ALL_STORES;

    const result = await getProductDetail(repo, id, store);
    return jsonResponse(result);
  });
}
