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

export const PERIOD_LABEL = {
  [PERIOD.DAYS_7]: "Last 7 days",
  [PERIOD.DAYS_30]: "Last 30 days",
  [PERIOD.DAYS_90]: "Last 90 days",
} as const;
