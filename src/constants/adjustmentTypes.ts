import { ACTION } from "./actions";

export const ADJUSTMENT_TYPE = {
  RECEIVE: "receive",
  SELL: "sell",
  WRITE_OFF: "write_off",
  TRANSFER: "transfer",
} as const;

export const ADJUSTMENT_ACTION = {
  [ADJUSTMENT_TYPE.RECEIVE]: ACTION.RECEIVE,
  [ADJUSTMENT_TYPE.SELL]: ACTION.SELL,
  [ADJUSTMENT_TYPE.WRITE_OFF]: ACTION.WRITE_OFF,
  [ADJUSTMENT_TYPE.TRANSFER]: ACTION.TRANSFER,
} as const;
