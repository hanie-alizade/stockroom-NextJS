import "server-only";

import { withApi } from "@/lib/server/http/with-api";
import { z } from "zod";
import { getProductMovements } from "@/lib/server/services/products";

const productMovementsQuerySchema = z.object({
  store: z.union([z.literal("all"), z.string()]).optional(),
  type: z
    .enum(["receive", "sell", "write_off", "transfer_out", "transfer_in", "import"])
    .optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } },
): Promise<Response> {
  return withApi(async ({ repo }) => {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const parsed = productMovementsQuerySchema.parse(rawParams);

    const result = await getProductMovements(repo, id, {
      store: parsed.store ?? "all",
      type: parsed.type,
      from: parsed.from,
      to: parsed.to,
      page: parsed.page ?? 1,
      pageSize: parsed.pageSize,
    });

    return result;
  });
}
