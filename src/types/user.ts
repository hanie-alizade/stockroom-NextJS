import type { z } from "zod";
import type { PERMISSION, ROLE } from "@/constants";
import type { sessionBodySchema, sessionResponseSchema, userSchema } from "@/schemas";

export type Role = (typeof ROLE)[keyof typeof ROLE];

export type Permission = (typeof PERMISSION)[keyof typeof PERMISSION];

export type User = z.infer<typeof userSchema>;

export type SessionBody = z.infer<typeof sessionBodySchema>;

export type SessionResponse = z.infer<typeof sessionResponseSchema>;
