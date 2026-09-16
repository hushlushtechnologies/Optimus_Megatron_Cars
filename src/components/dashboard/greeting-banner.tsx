import { AlertTriangle } from "lucide-react";
import { Card } from "@/src/components/ui/card";
import { actionAlerts } from "@/src/lib/mock-data/dashboard";

function getGreeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function GreetingBanner({ name }: { name: string }) {
  const greeting = getGreeting(new Date().getHours());

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 className="text-h2">
          {greeting}, <span className="text-primary">{name}</span>
        </h2>
        <p className="text-body-sm text-text-muted">
          Heres whats happening across Optimus Megatron Cars today.
        </p>
      </div>

      {actionAlerts.length > 0 && (
        <Card
          padding="sm"
          className="flex max-w-md items-start gap-2.5 border-l-2 border-l-primary"
        >
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-primary"
            aria-hidden="true"
          />
          <ul className="text-body-sm text-text-muted">
            {actionAlerts.map((alert) => (
              <li key={alert.id}>{alert.message}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
