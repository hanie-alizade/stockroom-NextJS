import { ALL_STORES } from "@/constants";
import type { StoreScope } from "@/types";

export interface StoreRouter {
  push: (href: string) => void;
}

export function setStoreScopeParam(
  router: StoreRouter,
  pathname: string,
  currentSearchParams:
    URLSearchParams | { toString: () => string; get: (key: string) => string | null },
  newStore?: StoreScope,
): void {
  const params = new URLSearchParams(currentSearchParams.toString());
  if (newStore && newStore !== ALL_STORES) {
    params.set("store", newStore);
  } else {
    params.delete("store");
  }
  params.delete("page");

  const qs = params.toString();
  router.push(qs ? `${pathname}?${qs}` : pathname);
}
