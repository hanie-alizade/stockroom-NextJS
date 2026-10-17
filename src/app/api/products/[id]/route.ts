import "server-only";

import { withApi } from "@/lib/server/http/with-api";
import { z } from "zod";
import { getProductDetail } from "@/lib/server/services/products";

const productDetailQuerySchema = z.object({
  store: z.union([z.literal("all"), z.string()]).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } },
): Promise<Response> {
  return withApi(async ({ repo }) => {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const parsed = productDetailQuerySchema.parse(rawParams);
    const store = parsed.store ?? "all";

    const result = await getProductDetail(repo, id, store);

    return result;
  });
}
