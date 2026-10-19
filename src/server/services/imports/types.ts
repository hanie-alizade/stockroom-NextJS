import "server-only";

import type { User, ImportCommitResult, ImportMapping } from "@/types";

export type ImportFileInput = {
  storeId: string;
  mapping: ImportMapping;
  fileText: string;
  fileName: string;
};

export type ImportCommitContext = {
  user: User;
  idempotencyKey?: string;
  fileName: string;
  now?: Date;
};

export type ImportCommitResultWithReplay = ImportCommitResult & {
  replay?: boolean;
};
