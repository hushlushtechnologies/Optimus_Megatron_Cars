import { ChevronDown, Info } from "lucide-react";

const DEFINITIONS = [
  { term: "Total Requests", text: "Every test drive that hasn't been archived." },
  { term: "Pending", text: "Requests waiting for approval." },
  { term: "Approved", text: "Confirmed appointments, including ones that were rescheduled." },
  {
    term: "Today",
    text: "Appointments scheduled for today in Dubai time, not counting rejected or cancelled ones.",
  },
  { term: "Completed", text: "Test drives that took place." },
  { term: "Cancelled", text: "Appointments that were cancelled." },
];

export function TestDriveMetricsHelp() {
  return (
    <details className="group border-border bg-card rounded-md border px-4 py-2.5">
      <summary className="text-body-sm text-text-muted hover:text-text-primary focus-visible:ring-primary flex cursor-pointer list-none items-center gap-2 rounded focus-visible:ring-2 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
        <Info className="size-4 shrink-0" aria-hidden="true" />
        How are these numbers counted?
        <ChevronDown
          className="ml-auto size-4 shrink-0 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
          aria-hidden="true"
        />
      </summary>

      <dl className="border-border mt-3 grid grid-cols-1 gap-x-6 gap-y-2 border-t pt-3 sm:grid-cols-2">
        {DEFINITIONS.map(({ term, text }) => (
          <div key={term}>
            <dt className="text-body-sm text-text-primary font-medium">{term}</dt>
            <dd className="text-caption text-text-muted">{text}</dd>
          </div>
        ))}
      </dl>

      <p className="text-caption text-text-subtle mt-3">
        Each card compares today with how things stood at the end of yesterday, in Dubai time. The small graph
        shows the last seven days. Pending, Approved, Completed and Cancelled use a grey indicator because a
        rise isn&apos;t clearly good or bad. Archived test drives are left out.
      </p>
    </details>
  );
}
