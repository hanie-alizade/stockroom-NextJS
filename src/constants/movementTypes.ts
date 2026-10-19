export const MOVEMENT_TYPE = {
  RECEIVE: "receive",
  SELL: "sell",
  WRITE_OFF: "write_off",
  TRANSFER_OUT: "transfer_out",
  TRANSFER_IN: "transfer_in",
  IMPORT: "import",
} as const;

export const MOVEMENT_TYPE_LABEL = {
  [MOVEMENT_TYPE.RECEIVE]: "Received",
  [MOVEMENT_TYPE.SELL]: "Sold",
  [MOVEMENT_TYPE.WRITE_OFF]: "Write-off",
  [MOVEMENT_TYPE.TRANSFER_OUT]: "Transfer out",
  [MOVEMENT_TYPE.TRANSFER_IN]: "Transfer in",
  [MOVEMENT_TYPE.IMPORT]: "Import",
} as const;
