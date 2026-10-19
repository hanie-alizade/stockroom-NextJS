import { z } from "zod";
import {
  IMPORT_FIELD,
  IMPORT_REQUIRED_FIELDS,
} from "@/constants";
import { storeIdSchema } from "./common";

export const importFieldSchema = z.enum([
  IMPORT_FIELD.SKU,
  IMPORT_FIELD.NAME,
  IMPORT_FIELD.CATEGORY,
  IMPORT_FIELD.QUANTITY,
  IMPORT_FIELD.UNIT_COST,
]);

export const importMappingSchema = z
  .preprocess((val) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    }
    return val;
  }, z.record(z.string(), z.string()))
  .superRefine((mapping, ctx) => {
    // Check all required fields are mapped
    for (const requiredField of IMPORT_REQUIRED_FIELDS) {
      const col = mapping[requiredField];
      if (!col || typeof col !== "string" || col.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Missing required field: ${requiredField}`,
          path: [requiredField],
        });
      }
    }

    // Check each column is used at most once
    const usedColumns = new Map<string, string>();
    for (const [field, col] of Object.entries(mapping)) {
      if (!col || typeof col !== "string" || col.trim() === "") continue;
      const normalizedCol = col.trim();
      const existingField = usedColumns.get(normalizedCol);
      if (existingField) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Column "${normalizedCol}" is mapped to multiple fields`,
          path: [field],
        });
      } else {
        usedColumns.set(normalizedCol, field);
      }
    }
  });

export const importFormSchema = z.object({
  storeId: storeIdSchema,
  mapping: importMappingSchema,
});
