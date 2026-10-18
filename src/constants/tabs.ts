export const DETAIL_TAB = {
  OVERVIEW: "overview",
  MOVEMENTS: "movements",
} as const;

export type DetailTab = (typeof DETAIL_TAB)[keyof typeof DETAIL_TAB];
