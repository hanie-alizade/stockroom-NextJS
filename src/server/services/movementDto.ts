import "server-only";

import { UNKNOWN_USER_INITIALS, UNKNOWN_USER_NAME } from "@/constants";
import type { MovementRecord, UserRecord } from "@/server/repositories";
import type { Movement } from "@/types";

/**
 * Maps a persistence MovementRecord to the API Movement DTO shape.
 */
export function toMovementDto(
  record: MovementRecord,
  userMap: Map<string, UserRecord>,
  counterpartByMovementId?: Map<string, string>,
): Movement {
  const user = userMap.get(record.userId);
  const counterpartStoreId = counterpartByMovementId?.get(record.id);

  return {
    id: record.id,
    productId: record.productId,
    storeId: record.storeId,
    type: record.type,
    quantity: record.quantity,
    balanceAfter: record.balanceAfter,
    createdAt: record.createdAt,
    by: {
      id: user?.id ?? record.userId,
      name: user?.name ?? UNKNOWN_USER_NAME,
      initials: user?.initials ?? UNKNOWN_USER_INITIALS,
    },
    ...(record.reason ? { note: record.reason } : {}),
    ...(record.transferId ? { transferId: record.transferId } : {}),
    ...(counterpartStoreId ? { counterpartStoreId } : {}),
  };
}
