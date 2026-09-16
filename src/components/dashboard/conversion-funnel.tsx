import { Card } from "@/src/components/ui/card";
import { conversion } from "@/src/lib/mock-data/dashboard";

const stages = [
  { key: "leads", label: "Leads" },
  { key: "testDrives", label: "Test Drives" },
  { key: "reservations", label: "Reservations" },
  { key: "sold", label: "Sold" },
] as const;

export function ConversionFunnel() {
  const max = conversion.leads;

  return (
    <Card variant="elevated" padding="lg" className="h-full">
      <h3 className="mb-1 text-h3">Conversion</h3>
      <p className="mb-4 text-body-sm text-text-muted">Lead → Sale funnel</p>

      <div className="flex flex-col gap-3">
        {stages.map((stage) => {
          const value = conversion[stage.key];
          const percentage = Math.round((value / max) * 100);

          return (
            <div key={stage.key}>
              <div className="mb-1 flex items-center justify-between text-body-sm">
                <span className="text-text-muted">{stage.label}</span>
                <span className="tabular-nums text-text-primary">{value}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-card-hover">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
