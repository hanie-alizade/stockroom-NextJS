import "server-only";

import { withApi } from "@/server/http/withApi";
import { productListQuerySchema } from "@/schemas";
import { listProducts } from "@/server/services/products";

export async function GET(request: Request): Promise<Response> {
  return withApi(async ({ repo }) => {
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const parsed = productListQuerySchema.parse(rawParams);

    const result = await listProducts(repo, parsed);

    return result;
  }, { request });
}
