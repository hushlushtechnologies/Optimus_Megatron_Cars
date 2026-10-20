function Note({ label, hint, value }: { label: string; hint?: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-body-sm text-text-primary font-medium">{label}</p>
      {hint && <p className="text-caption text-text-subtle">{hint}</p>}
      {value && value.trim() ? (
        <p className="bg-card-hover/50 text-body-sm text-text-primary rounded-md px-3 py-2 whitespace-pre-wrap">
          {value}
        </p>
      ) : (
        <p className="text-body-sm text-text-subtle">None.</p>
      )}
    </div>
  );
}

export function NotesCard({
  customerNotes,
  internalNotes,
}: {
  customerNotes: string | null;
  internalNotes: string | null;
}) {
  return (
    <section aria-label="Notes" className="surface-card flex flex-col gap-4 p-5">
      <p className="text-label">Notes</p>

      <Note label="Customer request" hint="What the customer asked for." value={customerNotes} />
      <Note
        label="Internal notes"
        hint="Only staff see these. The customer never does."
        value={internalNotes}
      />

      <p className="border-border text-caption text-text-subtle border-t pt-3">
        Use Edit from the actions menu to change these notes.
      </p>
    </section>
  );
}
