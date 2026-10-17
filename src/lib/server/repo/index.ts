import type { Repository, Product, Stock, Movement, User, IdempotencyRecord } from "./types";
import { createRepository } from "./in-memory";

export type { Repository, Product, Stock, Movement, User, IdempotencyRecord };
export { createRepository };
