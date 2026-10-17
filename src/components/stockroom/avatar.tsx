import { cn } from "@/lib/utils";
import { Avatar as ShadcnAvatar, AvatarFallback } from "@/components/ui/avatar";

interface AvatarProps {
  initials: string;
  accessibleName?: string;
  className?: string;
}

export function Avatar({ initials, accessibleName, className }: AvatarProps): React.ReactElement {
  return (
    <ShadcnAvatar className={cn("h-7 w-7", className)}>
      <AvatarFallback
        className="bg-bg-subtle text-text-secondary text-body-small font-medium"
        aria-label={accessibleName}
      >
        {initials}
      </AvatarFallback>
    </ShadcnAvatar>
  );
}
