import "server-only";

import { withApi } from "@/lib/server/http/with-api";
import { productListQuerySchema } from "@/lib/domain/schemas";
import { listProducts } from "@/lib/server/services/products";

export async function GET(request: Request): Promise<Response> {
  return withApi(async ({ repo }) => {
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const parsed = productListQuerySchema.parse(rawParams);

    const result = await listProducts(repo, parsed);

    return result;
  });
}
