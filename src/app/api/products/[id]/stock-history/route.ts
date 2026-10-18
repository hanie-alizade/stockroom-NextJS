import "server-only";

import { ALL_STORES } from "@/constants";
import { withApi } from "@/server/http/withApi";
import { stockHistoryQuerySchema } from "@/schemas";
import { getStockHistory } from "@/server/services/products";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } },
): Promise<Response> {
  return withApi(async ({ repo }) => {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const parsed = stockHistoryQuerySchema.parse(rawParams);

    const result = await getStockHistory(repo, id, parsed.store ?? ALL_STORES, parsed.days ?? 30);

    return result;
  }, { request });
}
