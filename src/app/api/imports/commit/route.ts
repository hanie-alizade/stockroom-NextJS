import "server-only";

import {
  HTTP_STATUS,
  IDEMPOTENCY_KEY_HEADER,
  PERMISSION,
  REPLAY_HEADER,
} from "@/constants";
import { jsonResponse, withApi } from "@/server/http";
import { commitImport, readImportForm } from "@/server/services/imports";

/**
 * Commits a CSV import file into inventory within a single transaction.
 * Requires IMPORT permission (Manager only) and Idempotency-Key header.
 */
export async function POST(request: Request): Promise<Response> {
  return withApi(
    request,
    async ({ user, repo }) => {
      const idempotencyKey = request.headers.get(IDEMPOTENCY_KEY_HEADER) ?? "";
      const input = await readImportForm(request, repo);

      const result = await commitImport(repo, input, {
        user,
        idempotencyKey,
        fileName: input.fileName,
      });

      const headers: Record<string, string> = {};
      if (result.replay) {
        headers[REPLAY_HEADER] = "true";
      }

      return jsonResponse(
        {
          created: result.created,
          updated: result.updated,
          unchanged: result.unchanged,
          skipped: result.skipped,
          skippedRows: result.skippedRows,
        },
        {
          status: HTTP_STATUS.OK,
          headers,
        },
      );
    },
    { permission: PERMISSION.IMPORT },
  );
}
