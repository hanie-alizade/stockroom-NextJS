import axios from "axios";
import type { ApiErrorBody } from "@/types";

export class ApiError extends Error {
  public code: string;

  constructor(
    public body: ApiErrorBody,
    public status?: number,
    code?: string,
  ) {
    super(body.message);
    this.name = "ApiError";
    this.code = code ?? body.error;
  }
}

export const axiosInstance = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data) {
      const body = error.response.data as ApiErrorBody;
      throw new ApiError(body, error.response.status, body.error);
    }
    if (error.request && !error.response) {
      throw new ApiError(
        {
          error: "INTERNAL_ERROR",
          message: error.message || "Network error",
          fieldErrors: [],
        },
        error.status ?? 0,
        "NETWORK_ERROR",
      );
    }
    throw error;
  },
);
