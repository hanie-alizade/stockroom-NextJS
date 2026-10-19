import type { User } from "@/types";

export type AdjustmentContext = {
  user: User;
  idempotencyKey: string;
  now?: Date;
  requestHash?: string;
};
