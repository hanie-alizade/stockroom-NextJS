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
import { createRepository } from "./in-memory";

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
