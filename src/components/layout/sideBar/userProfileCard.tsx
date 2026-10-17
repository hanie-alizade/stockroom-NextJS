import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function UserProfileCard(): React.ReactElement {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border-default bg-bg-surface p-3">
      <Avatar className="size-8">
        <AvatarFallback className="bg-accent-subtle text-accent-default text-xs">
          AR
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-1 flex-col">
        <span className="text-body-strong text-text-primary">Aina Rahman</span>
        <span className="text-caption text-text-secondary">Manager</span>
      </div>

      <button
        type="button"
        className="text-sm font-medium text-accent-default transition-colors hover:text-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
      >
        Switch
      </button>
    </div>
  );
}
