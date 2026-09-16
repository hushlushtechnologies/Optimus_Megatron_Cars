export function SystemStatus() {
  return (
    <div
      title="All systems operational"
      className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 md:flex"
    >
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-success " />
      </span>
      <span className="text-caption text-text-muted">Operational</span>
    </div>
  );
}
