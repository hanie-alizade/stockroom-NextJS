import "server-only";

import { ALL_STORES } from "@/constants";
import { withApi } from "@/lib/server/http/with-api";
import { z } from "zod";
import { getStockHistory } from "@/lib/server/services/products";

const stockHistoryQuerySchema = z.object({
  store: z.union([z.literal(ALL_STORES), z.string()]).optional(),
  days: z.coerce.number().int().positive().optional(),
});

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
  });
}
