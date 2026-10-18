import { z } from "zod";
import { userSchema, sessionResponseSchema } from "./user";

export const metaResponseSchema = z.object({
  stores: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    }),
  ),
  categories: z.array(
    z.object({
      name: z.string(),
    }),
  ),
  users: z.array(userSchema),
  currentUser: userSchema,
});

export { sessionResponseSchema };
