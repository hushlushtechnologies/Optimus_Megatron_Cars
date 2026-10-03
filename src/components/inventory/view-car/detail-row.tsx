export function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-body-sm text-text-muted">{label}</span>
      <span className="text-body-sm text-text-primary">{value ?? "—"}</span>
    </div>
  );
}

export function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="surface-card p-5">
      <p className="text-label mb-1">{title}</p>
      <div className="divide-border divide-y">{children}</div>
    </div>
  );
}
