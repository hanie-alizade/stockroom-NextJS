import axios from "axios";
import type { ApiErrorBody } from "@/types";

export class ApiError extends Error {
  constructor(public body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
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
      throw new ApiError(error.response.data);
    }
    throw error;
  },
);
