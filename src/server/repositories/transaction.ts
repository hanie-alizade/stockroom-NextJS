import "server-only";

import type { StoreData } from "./seedLoader";
import type { IdempotencyRecord, ProductRecord, StockRecord } from "./types";

export type SnapshotEntry =
  | { type: "product"; sku: string; value: ProductRecord | undefined }
  | { type: "stock"; productId: string; storeId: string; value: StockRecord | undefined }
  | { type: "movements"; prevLength: number }
  | { type: "idempotency"; key: string; value: IdempotencyRecord | undefined };

export class TransactionManager {
  private snapshots: Map<string, SnapshotEntry> = new Map();

  snapshotProduct(sku: string, existing: ProductRecord | undefined): void {
    const key = `product:${sku}`;
    if (!this.snapshots.has(key)) {
      this.snapshots.set(key, {
        type: "product",
        sku,
        value: existing ? { ...existing } : undefined,
      });
    }
  }

  snapshotStock(productId: string, storeId: string, existing: StockRecord | undefined): void {
    const key = `stock:${productId}:${storeId}`;
    if (!this.snapshots.has(key)) {
      this.snapshots.set(key, {
        type: "stock",
        productId,
        storeId,
        value: existing ? { ...existing } : undefined,
      });
    }
  }

  snapshotMovements(prevLength: number): void {
    const key = "movements";
    if (!this.snapshots.has(key)) {
      this.snapshots.set(key, { type: "movements", prevLength });
    }
  }

  snapshotIdempotency(keyName: string, existing: IdempotencyRecord | undefined): void {
    const key = `idempotency:${keyName}`;
    if (!this.snapshots.has(key)) {
      this.snapshots.set(key, {
        type: "idempotency",
        key: keyName,
        value: existing ? { ...existing } : undefined,
      });
    }
  }

  rollback(data: StoreData): void {
    for (const entry of this.snapshots.values()) {
      switch (entry.type) {
        case "product":
          if (entry.value === undefined) {
            data.products.delete(entry.sku);
          } else {
            data.products.set(entry.sku, entry.value);
          }
          break;

        case "stock": {
          const stocks = data.stock.get(entry.productId);
          if (stocks) {
            const index = stocks.findIndex((s) => s.storeId === entry.storeId);
            if (entry.value === undefined) {
              if (index !== -1) {
                stocks.splice(index, 1);
              }
            } else if (index !== -1) {
              stocks[index] = entry.value;
            } else {
              stocks.push(entry.value);
            }
          }
          break;
        }

        case "movements": {
          const addedMovements = data.movements.slice(entry.prevLength);
          for (const m of addedMovements) {
            const skuList = data.movementsBySku.get(m.productId);
            if (skuList) {
              const idx = skuList.findIndex((item) => item.id === m.id);
              if (idx !== -1) {
                skuList.splice(idx, 1);
              }
            }
          }
          data.movements.length = entry.prevLength;
          break;
        }

        case "idempotency":
          if (entry.value === undefined) {
            data.idempotency.delete(entry.key);
          } else {
            data.idempotency.set(entry.key, entry.value);
          }
          break;
      }
    }
  }
}
