import { Trophy } from "lucide-react";
import { Card } from "@/src/components/ui/card";
import { fastestSelling } from "@/src/lib/mock-data/dashboard";

export function FastestSelling() {
  return (
    <Card variant="elevated" padding="lg" className="h-full">
      <h3 className="mb-3 text-h3">Fastest Selling</h3>
      <ul className="flex flex-col gap-3">
        {fastestSelling.map((car, index) => (
          <li key={car.id} className="flex items-center gap-3">
            <span
              className={
                index === 0
                  ? "flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-caption font-semibold text-primary"
                  : "flex size-7 shrink-0 items-center justify-center rounded-full bg-card-hover text-caption font-semibold text-text-muted"
              }
            >
              {index === 0 ? (
                <Trophy className="size-3.5" aria-hidden="true" />
              ) : (
                index + 1
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-sm text-text-primary">
                {car.name}
              </p>
              <p className="text-caption">{car.location}</p>
            </div>
            <span className="shrink-0 text-body-sm tabular-nums text-text-muted">
              {car.daysToSell}d
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
