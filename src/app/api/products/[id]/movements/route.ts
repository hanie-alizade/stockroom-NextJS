import "server-only";

import { ALL_STORES, DEFAULT_PAGE } from "@/constants";
import { jsonResponse, parseQuery, withApi } from "@/server/http";
import type { RouteContext } from "@/server/http";
import { movementListQuerySchema } from "@/schemas";
import { getProductMovements } from "@/server/services/products";

export async function GET(
  request: Request,
  { params }: RouteContext,
): Promise<Response> {
  return withApi(request, async ({ repo }) => {
    const { id } = await params;
    const parsed = parseQuery(request, movementListQuerySchema);

    const result = await getProductMovements(repo, id, {
      store: parsed.store ?? ALL_STORES,
      type: parsed.type,
      from: parsed.from,
      to: parsed.to,
      period: parsed.period,
      page: parsed.page ?? DEFAULT_PAGE,
      pageSize: parsed.pageSize,
    });

    return jsonResponse(result);
  });
}
