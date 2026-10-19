import "server-only";

import { HTTP_STATUS, PERMISSION } from "@/constants";
import { jsonResponse, withApi } from "@/server/http";
import { readImportForm, validateImport } from "@/server/services/imports";

/**
 * Validates an uploaded CSV import file against existing inventory.
 * Requires IMPORT permission (Manager only).
 */
export async function POST(request: Request): Promise<Response> {
  return withApi(
    request,
    async ({ repo }) => {
      const input = await readImportForm(request, repo);
      const result = validateImport(repo, input);

      return jsonResponse(result, {
        status: HTTP_STATUS.OK,
      });
    },
    { permission: PERMISSION.IMPORT },
  );
}
