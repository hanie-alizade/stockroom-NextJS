"use client";

import { cn } from "@/lib/utils";
import { Avatar } from "./avatar";
import { StoreSelect } from "./store-select";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { StoreIcon, ChevronRightIcon } from "@/components/icons";
import type { ReactNode } from "react";

interface NavItem {
  label: string;
  value: string;
  active?: boolean;
  disabled?: boolean;
  badge?: ReactNode;
}

interface SidebarProps {
  stores: { value: string; label: string }[];
  selectedStore: string;
  onStoreChange: (store: string) => void;
  navItems: NavItem[];
  onNavigate: (value: string) => void;
  user: {
    initials: string;
    name: string;
    role: string;
  };
  onSwitchUser: () => void;
  showImport?: boolean;
}

export function AppSidebar({
  stores,
  selectedStore,
  onStoreChange,
  navItems,
  onNavigate,
  user,
  onSwitchUser,
  showImport = true,
}: SidebarProps): React.ReactElement {
  const sidebarContent = (
    <div className="bg-bg-surface border-border-default flex h-full w-[248px] flex-col border-r">
      {/* Brand block */}
      <div className="p-lg border-border-default border-b">
        <div className="gap-sm mb-xs flex items-center">
          <div className="bg-accent-default text-text-on-accent text-card flex h-8 w-8 items-center justify-center rounded-lg font-bold">
            KL
          </div>
          <div>
            <h1 className="text-card text-text-primary">Stockroom</h1>
            <p className="text-caption text-text-secondary">Kopi Lane</p>
          </div>
        </div>
      </div>

      {/* Store selector */}
      <div className="p-lg pb-md">
        <StoreSelect
          options={[{ value: "all", label: "All stores (6)" }, ...stores]}
          value={selectedStore}
          onValueChange={onStoreChange}
        />
      </div>

      {/* Navigation */}
      <div className="px-lg flex-1">
        <p className="text-overline text-text-tertiary mb-sm tracking-wider uppercase">Inventory</p>
        <nav className="space-y-xs">
          {navItems.map((item) => {
            if (item.label === "Import" && !showImport) {
              return null;
            }

            return (
              <button
                key={item.value}
                onClick={() => !item.disabled && onNavigate(item.value)}
                disabled={item.disabled}
                aria-disabled={item.disabled}
                className={cn(
                  "px-md py-sm text-body-small focus-ring flex w-full items-center justify-between rounded-md font-medium transition-colors",
                  item.active
                    ? "bg-accent-subtle text-accent-default"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-subtle",
                  item.disabled && "text-text-disabled cursor-not-allowed",
                )}
              >
                <span className="gap-sm flex items-center">{item.label}</span>
                {item.badge}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User card */}
      <div className="p-lg border-border-default border-t">
        <div className="gap-sm flex items-center">
          <Avatar initials={user.initials} accessibleName={user.name} />
          <div className="min-w-0 flex-1">
            <p className="text-body-strong text-text-primary truncate">{user.name}</p>
            <p className="text-caption text-text-secondary truncate">{user.role}</p>
          </div>
          <button
            onClick={onSwitchUser}
            className="text-label text-text-link focus-ring hover:underline"
          >
            Switch
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block">{sidebarContent}</div>

      {/* Mobile sidebar */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <button
              className="p-md text-text-secondary hover:text-text-primary focus-ring"
              aria-label="Open menu"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[248px] p-0">
            {sidebarContent}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
