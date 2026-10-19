import "server-only";

import { jsonResponse, parseQuery, withApi } from "@/server/http";
import { productListQuerySchema } from "@/schemas";
import { listProducts } from "@/server/services/products";

export async function GET(request: Request): Promise<Response> {
  return withApi(request, async ({ repo }) => {
    const parsed = parseQuery(request, productListQuerySchema);
    const result = await listProducts(repo, parsed);
    return jsonResponse(result);
  });
}
