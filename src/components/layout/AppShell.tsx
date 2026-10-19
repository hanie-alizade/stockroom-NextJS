import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileHeader } from "./MobileHeader";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps): React.ReactElement {
  return (
    <div className="bg-bg-canvas flex min-h-screen">
      {/* Desktop sidebar - visible from lg (1024) up */}
      <div className="hidden lg:block sticky top-0 h-dvh">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile/tablet top bar - visible below lg */}
        <div className="lg:hidden">
          <MobileHeader />
        </div>

        {/* Page content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
