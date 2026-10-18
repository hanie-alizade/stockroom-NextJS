import { z } from "zod";
import { PAGE_SIZE_OPTIONS } from "@/constants";

export const storeIdSchema = z.string().trim().min(1);

export const storeScopeSchema = z.string().trim().min(1);

export const quantitySchema = z.number().int().positive();

export const noteSchema = z.string().trim().max(200);

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce
    .number()
    .int()
    .positive()
    .refine((size) => (PAGE_SIZE_OPTIONS as readonly number[]).includes(size), {
      message: `Page size must be one of ${PAGE_SIZE_OPTIONS.join(", ")}`,
    })
    .optional(),
});
