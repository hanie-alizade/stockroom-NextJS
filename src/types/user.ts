import type { z } from "zod";
import type { ACTION, ROLE } from "@/constants";
import type { sessionBodySchema, sessionResponseSchema, userSchema } from "@/schemas";

export type Role = (typeof ROLE)[keyof typeof ROLE];

export type Action = (typeof ACTION)[keyof typeof ACTION];

export type User = z.infer<typeof userSchema>;

export type SessionBody = z.infer<typeof sessionBodySchema>;

export type SessionResponse = z.infer<typeof sessionResponseSchema>;
