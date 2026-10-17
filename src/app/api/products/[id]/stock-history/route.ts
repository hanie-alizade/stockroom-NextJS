import "server-only";

import { withApi } from "@/lib/server/http/with-api";
import { z } from "zod";
import { getStockHistory } from "@/lib/server/services/products";

const stockHistoryQuerySchema = z.object({
  store: z.union([z.literal("all"), z.string()]).optional(),
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

    const result = await getStockHistory(repo, id, parsed.store ?? "all", parsed.days ?? 30);

    return result;
  });
}
