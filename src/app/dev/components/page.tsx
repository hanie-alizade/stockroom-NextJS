"use client";

import { Toaster } from "@/components/ui/sonner";
import { ButtonShowcase } from "./showcase-button-section";
import { InputShowcase } from "./showcase-input-section";
import { SelectShowcase } from "./showcase-select-section";
import { CheckboxShowcase } from "./showcase-checkbox-section";
import { BadgeShowcase } from "./showcase-badge-section";
import { AvatarShowcase } from "./showcase-avatar-section";
import { SegmentedControlShowcase } from "./showcase-segmented-section";
import { TabsShowcase } from "./showcase-tabs-section";
import { TableShowcase } from "./showcase-table-section";
import { PaginationShowcase } from "./showcase-pagination-section";
import { EmptyStateShowcase } from "./showcase-empty-section";
import { AlertShowcase } from "./showcase-alert-section";
import { InteractiveShowcase } from "./showcase-interactive-section";
import { SidebarShowcase } from "./showcase-sidebar-section";

export default function ComponentShowcase(): React.ReactElement {
  return (
    <div className="bg-bg-canvas p-lg min-h-screen">
      <Toaster />
      <h1 className="text-page-title text-text-primary mb-2xl">Component Showcase</h1>

      <div className="space-y-3xl">
        <ButtonShowcase />
        <InputShowcase />
        <SelectShowcase />
        <CheckboxShowcase />
        <BadgeShowcase />
        <AvatarShowcase />
        <SegmentedControlShowcase />
        <TabsShowcase />
        <TableShowcase />
        <PaginationShowcase />
        <EmptyStateShowcase />
        <AlertShowcase />
        <InteractiveShowcase />
        <SidebarShowcase />
      </div>
    </div>
  );
}
