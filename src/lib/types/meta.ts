import { z } from "zod";

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
  users: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      initials: z.string(),
      role: z.enum(["manager", "staff"]),
    }),
  ),
  currentUser: z.object({
    id: z.string(),
    name: z.string(),
    initials: z.string(),
    role: z.enum(["manager", "staff"]),
  }),
});

export type MetaResponse = z.infer<typeof metaResponseSchema>;

export const sessionResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    initials: z.string(),
    role: z.enum(["manager", "staff"]),
  }),
});

export type SessionResponse = z.infer<typeof sessionResponseSchema>;
