export const DEV_PARAM = {
  FAIL: "fail",
  SLOW: "slow",
  VALUE: "1",
} as const;

export type DevParam = (typeof DEV_PARAM)[keyof typeof DEV_PARAM];
