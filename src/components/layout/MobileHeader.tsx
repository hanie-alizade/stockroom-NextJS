"use client";

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MenuIcon } from "@/components/icons";
import { Sidebar } from "./Sidebar";

export function MobileHeader(): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentKey = `${pathname}?${searchParams.toString()}`;
  const [prevKey, setPrevKey] = useState(currentKey);

  if (currentKey !== prevKey) {
    setPrevKey(currentKey);
    setIsOpen(false);
  }

  return (
    <header className="border-border-default bg-bg-surface flex h-14 items-center border-b px-4">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className="hover:bg-bg-subtle focus-visible:ring-border-focus flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md focus-visible:ring-2 focus-visible:outline-none"
            aria-label="Open navigation menu"
          >
            <MenuIcon className="size-5" />
          </button>
        </SheetTrigger>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-[85vw] max-w-[320px] sm:max-w-[320px] p-0 bg-bg-surface border-r border-border-default flex flex-col h-full overflow-y-auto"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation menu</SheetTitle>
          </SheetHeader>
          <div
            className="flex h-full w-full flex-col"
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (target.closest("a")) {
                setIsOpen(false);
              }
            }}
          >
            <Sidebar className="w-full border-r-0" />
          </div>
        </SheetContent>
      </Sheet>

      <div className="ml-3 flex items-center gap-2">
        <div className="bg-bg-subtle flex size-6 shrink-0 items-center justify-center rounded-md">
          <span className="text-text-primary text-xs font-semibold">KL</span>
        </div>
        <span className="text-body-strong text-text-primary">Stockroom</span>
      </div>
    </header>
  );
}
