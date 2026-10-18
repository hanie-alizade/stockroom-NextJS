import { z } from "zod";

const envSchema = z.object({
  SIMULATED_LATENCY_MS: z.coerce.number().int().nonnegative().default(500),
  E2E: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

export function getEnv(): Env {
  return envSchema.parse(process.env);
}

export const env = new Proxy({} as Env, {
  get(_target, prop: string) {
    const parsed = envSchema.parse(process.env);
    return parsed[prop as keyof Env];
  },
});
