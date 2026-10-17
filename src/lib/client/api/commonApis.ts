import { apiClient } from "./client";
import type { MetaResponse, SessionResponse } from "@/lib/types/meta";
import { metaResponseSchema, sessionResponseSchema } from "@/lib/types/meta";

export type { MetaResponse, SessionResponse } from "@/lib/types/meta";

export async function getMeta(): Promise<MetaResponse> {
  const response = await apiClient.get("/api/meta");

  return metaResponseSchema.parse(response.data);
}

export async function switchUser(userId: string): Promise<SessionResponse> {
  const { data } = await apiClient.post("/api/session", { userId });
  return sessionResponseSchema.parse(data);
}
