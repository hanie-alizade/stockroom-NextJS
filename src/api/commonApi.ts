import { axiosInstance } from "./axiosConfig";
import type { MetaResponse, SessionResponse } from "@/types";
import { metaResponseSchema, sessionResponseSchema } from "@/schemas";

export type { MetaResponse, SessionResponse } from "@/types";

export async function getMeta(): Promise<MetaResponse> {
  const response = await axiosInstance.get("/api/meta");

  return metaResponseSchema.parse(response.data);
}

export async function switchUser(userId: string): Promise<SessionResponse> {
  const { data } = await axiosInstance.post("/api/session", { userId });
  return sessionResponseSchema.parse(data);
}
