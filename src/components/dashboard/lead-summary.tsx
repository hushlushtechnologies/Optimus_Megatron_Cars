import { Card } from "@/src/components/ui/card";
import { leadSummary } from "@/src/lib/mock-data/dashboard";

export function LeadSummary() {
  const max = Math.max(...leadSummary.map((s) => s.count));

  return (
    <Card variant="elevated" padding="lg" className="h-full">
      <h3 className="mb-4 text-h3">Lead Summary</h3>
      <div className="flex flex-col gap-3">
        {leadSummary.map((item) => (
          <div key={item.source} className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate text-body-sm text-text-muted">
              {item.source}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-card-hover">
              <div
                className="h-full rounded-full bg-primary/70"
                style={{ width: `${(item.count / max) * 100}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-body-sm tabular-nums text-text-muted">
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
