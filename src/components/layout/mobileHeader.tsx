"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { InfoIcon } from "@/components/icons";
import { Sidebar } from "./sideBar/sidebar";

export function MobileHeader(): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className="border-border-default bg-bg-surface flex h-14 items-center border-b px-4">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="hover:bg-bg-subtle focus-visible:ring-border-focus flex size-11 shrink-0 items-center justify-center rounded-md focus-visible:ring-2 focus-visible:outline-none"
              aria-label="Open navigation menu"
            >
              {/* TODO: add icon: MenuIcon */}
              <InfoIcon className="size-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" showCloseButton={false} className="w-[280px] max-w-[280px] p-0">
            <Sidebar />
          </SheetContent>
        </Sheet>

        <div className="ml-3 flex items-center gap-2">
          <div className="bg-bg-subtle flex size-6 shrink-0 items-center justify-center rounded-md">
            <span className="text-text-primary text-xs font-semibold">KL</span>
          </div>
          <span className="text-body-strong text-text-primary">Stockroom</span>
        </div>
      </header>
    </>
  );
}
