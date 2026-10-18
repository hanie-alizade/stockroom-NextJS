import "server-only";

import { ALL_STORES, DEFAULT_PAGE, MOVEMENT_TYPE } from "@/constants";
import { withApi } from "@/lib/server/http/with-api";
import { z } from "zod";
import { getProductMovements } from "@/lib/server/services/products";

const productMovementsQuerySchema = z.object({
  store: z.union([z.literal(ALL_STORES), z.string()]).optional(),
  type: z.nativeEnum(MOVEMENT_TYPE).optional(),
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
