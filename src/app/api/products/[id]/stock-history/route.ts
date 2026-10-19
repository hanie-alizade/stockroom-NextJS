import "server-only";

import { ALL_STORES } from "@/constants";
import { jsonResponse, parseQuery, withApi } from "@/server/http";
import type { RouteContext } from "@/server/http";
import { stockHistoryQuerySchema } from "@/schemas";
import { getStockHistory } from "@/server/services/products";

export async function GET(request: Request, { params }: RouteContext): Promise<Response> {
  return withApi(request, async ({ repo }) => {
    const { id } = await params;
    const parsed = parseQuery(request, stockHistoryQuerySchema);

    const result = await getStockHistory(repo, id, parsed.store ?? ALL_STORES, parsed.days ?? 30);
    return jsonResponse(result);
  });
}
