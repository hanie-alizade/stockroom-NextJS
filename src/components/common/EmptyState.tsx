import type { ReactNode } from "react";
import type { IconComponent } from "@/components/icons";
import { StateBlock } from "./StateBlock";

export interface EmptyStateProps {
  icon: IconComponent;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionElement?: ReactNode;
  className?: string;
}

export function EmptyState(props: EmptyStateProps): React.ReactElement {
  return <StateBlock {...props} iconVariant="neutral" />;
}
