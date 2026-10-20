import { z } from "zod";
import { MAX_QUANTITY, PAGE_SIZE_OPTIONS } from "@/constants";

export const storeIdSchema = z.string().trim().min(1);

export const storeScopeSchema = z.string().trim().min(1);

export const quantitySchema = z
  .number({
    invalid_type_error: "Enter a whole number above 0.",
  })
  .int({ message: "Enter a whole number." })
  .positive({ message: "Enter a number above 0." })
  .max(MAX_QUANTITY, { message: "Quantity can't be more than 1,000,000." });

export const noteSchema = z.string().trim().max(200);

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce
    .number()
    .int()
    .positive()
    .refine((size) => PAGE_SIZE_OPTIONS.some((opt) => opt === size), {
      message: `Page size must be one of ${PAGE_SIZE_OPTIONS.join(", ")}`,
    })
    .optional(),
});
