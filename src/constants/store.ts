export const ALL_STORES = "all" as const;
export const ALL_OPTION = "all" as const;

export const STORE_ID = {
  MONT_KIARA: "mont-kiara",
  SUBANG: "subang",
  DAMANSARA: "damansara",
  CHERAS: "cheras",
  PUCHONG: "puchong",
  SHAH_ALAM: "shah-alam",
} as const;

export const STORE_IDS = Object.values(STORE_ID);
export type StoreIdConstant = (typeof STORE_ID)[keyof typeof STORE_ID];
