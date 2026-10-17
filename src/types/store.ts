export type StoreId = string; // kebab-case slug, for example "mont-kiara"

export type Store = {
  id: StoreId;
  name: string;
};

export type StoreScope = "all" | StoreId;

// Repository internal type (not part of Contracts)
export type RepoStore = Store;
