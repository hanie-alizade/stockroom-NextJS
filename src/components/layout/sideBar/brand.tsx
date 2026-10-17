export function Brand(): React.ReactElement {
  return (
    <div className="mb-4 flex items-center gap-3">
      {/* Logo */}
      <div className="bg-accent-default flex size-8 shrink-0 items-center justify-center rounded-md">
        <span className="text-text-on-accent text-label">KL</span>
      </div>

      {/* Brand name and secondary label */}
      <div className="flex flex-col">
        <span className="text-body-strong text-text-primary">Stockroom</span>
        <span className="text-caption text-text-secondary">Kopi Lane</span>
      </div>
    </div>
  );
}
