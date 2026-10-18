import { z } from "zod";
import { ROLE } from "@/constants";

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
      role: z.nativeEnum(ROLE),
    }),
  ),
  currentUser: z.object({
    id: z.string(),
    name: z.string(),
    initials: z.string(),
    role: z.nativeEnum(ROLE),
  }),
});

export type MetaResponse = z.infer<typeof metaResponseSchema>;

export const sessionResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    initials: z.string(),
    role: z.nativeEnum(ROLE),
  }),
});

export type SessionResponse = z.infer<typeof sessionResponseSchema>;
