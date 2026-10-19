import type { ALL_STORES } from "@/constants";

export type StoreId = string; // kebab-case slug, for example "mont-kiara"

export type Store = {
  id: StoreId;
  name: string;
};

export type StoreScope = typeof ALL_STORES | StoreId;
