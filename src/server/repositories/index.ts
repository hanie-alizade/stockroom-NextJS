import type {
  Repository,
  Product,
  Stock,
  Movement,
  User,
  Store,
  Category,
  Supplier,
  IdempotencyRecord,
} from "./types";
import { createRepository } from "./inMemory";

export type {
  Repository,
  Product,
  Stock,
  Movement,
  User,
  Store,
  Category,
  Supplier,
  IdempotencyRecord,
};
export { createRepository };
