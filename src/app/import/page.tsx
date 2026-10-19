import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/session";
import { roleHasPermission } from "@/domain";
import { PERMISSION } from "@/constants";

export default async function ImportPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser();
  if (!roleHasPermission(user.role, PERMISSION.IMPORT)) {
    redirect("/products?notice=managers-only");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-page-title text-text-primary">Import</h1>
      <p className="text-body text-text-secondary mt-2">CSV import</p>
    </div>
  );
}
