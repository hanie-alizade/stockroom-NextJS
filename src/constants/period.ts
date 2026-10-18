export const PERIOD = {
  DAYS_7: "7d",
  DAYS_30: "30d",
  DAYS_90: "90d",
} as const;

export const PERIOD_DAYS = {
  [PERIOD.DAYS_7]: 7,
  [PERIOD.DAYS_30]: 30,
  [PERIOD.DAYS_90]: 90,
} as const;

export const DEFAULT_PERIOD = PERIOD.DAYS_30;
