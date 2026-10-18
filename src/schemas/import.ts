import { z } from "zod";
import { storeIdSchema } from "./common";

export const importRequestSchema = z.object({
  storeId: storeIdSchema,
  mapping: z.record(z.string()),
  rows: z.array(z.record(z.string())),
});
