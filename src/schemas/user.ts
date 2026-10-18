import { z } from "zod";
import { ROLE } from "@/constants";

export const roleSchema = z.nativeEnum(ROLE);

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  initials: z.string(),
  role: roleSchema,
});

export const sessionBodySchema = z.object({
  userId: z.string(),
});

export const sessionResponseSchema = z.object({
  user: userSchema,
});
