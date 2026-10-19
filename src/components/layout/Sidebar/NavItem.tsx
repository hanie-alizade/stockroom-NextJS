import Link from "next/link";
import type { IconComponent } from "@/components/icons";

interface NavItemProps {
  href: string;
  icon: IconComponent;
  label: string;
  active?: boolean;
  disabled?: boolean;
  badgeText?: string;
}

export function NavItem({
  href,
  icon: Icon,
  label,
  active = false,
  disabled = false,
  badgeText,
}: NavItemProps): React.ReactElement {
  const baseClasses =
    "flex h-9 w-[223px] items-center gap-2 rounded-lg px-3 text-body-strong transition-colors";

  if (disabled) {
    return (
      <div className={`${baseClasses} text-text-disabled cursor-not-allowed`} aria-disabled="true">
        <Icon className="text-text-disabled size-4 shrink-0" />
        <span className="text-body-strong">{label}</span>
        {badgeText && (
          <span className="bg-bg-muted text-text-tertiary text-caption ml-auto rounded-full px-2 py-0.5">
            {badgeText}
          </span>
        )}
      </div>
    );
  }

  if (active) {
    return (
      <Link
        href={href}
        className={`${baseClasses} bg-accent-subtle text-accent-default`}
        aria-current="page"
      >
        <Icon className="text-accent-default size-4" />
        <span className="text-body-strong text-accent-default">{label}</span>
      </Link>
    );
  }

  return (
    <Link href={href} className={`${baseClasses} text-text-primary hover:bg-bg-subtle`}>
      <Icon className="text-text-secondary size-4 shrink-0" />
      <span className="text-body-strong">{label}</span>
    </Link>
  );
}
