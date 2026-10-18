import "server-only";

import { ALL_STORES, DEFAULT_PAGE } from "@/constants";
import { withApi } from "@/lib/server/http/with-api";
import { movementListQuerySchema } from "@/schemas";
import { getProductMovements } from "@/lib/server/services/products";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } },
): Promise<Response> {
  return withApi(async ({ repo }) => {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const parsed = movementListQuerySchema.parse(rawParams);

    const result = await getProductMovements(repo, id, {
      store: parsed.store ?? ALL_STORES,
      type: parsed.type,
      from: parsed.from,
      to: parsed.to,
      page: parsed.page ?? DEFAULT_PAGE,
      pageSize: parsed.pageSize,
    });

    return result;
  });
}
