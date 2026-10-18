import type { z } from "zod";
import type { metaResponseSchema } from "@/schemas";

export type MetaResponse = z.infer<typeof metaResponseSchema>;
