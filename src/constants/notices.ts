export const NOTICE = {
  MANAGERS_ONLY: "managers-only",
} as const;

export type Notice = (typeof NOTICE)[keyof typeof NOTICE];
