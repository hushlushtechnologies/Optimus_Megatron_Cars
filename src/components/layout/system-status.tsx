export function SystemStatus() {
  return (
    <div
      title="All systems operational"
      className="border-border bg-card hidden items-center gap-2 rounded-full border px-3 py-1.5 md:flex"
    >
      <span className="relative flex size-2">
        <span className="bg-success absolute inline-flex size-full animate-ping rounded-full opacity-60" />
        <span className="bg-success relative inline-flex size-2 rounded-full" />
      </span>
      <span className="text-caption text-text-muted">Operational</span>
    </div>
  );
}
