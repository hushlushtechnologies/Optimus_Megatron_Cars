import { Card } from "@/src/components/ui/card";
import { topSalesExecutive } from "@/src/lib/mock-data/dashboard";

export function TopSalesExecutive() {
  return (
    <Card
      variant="elevated"
      padding="lg"
      className="flex h-full flex-col justify-between"
    >
      <div>
        <h3 className="text-h3">Top Sales Executive</h3>
        <p className="text-body-sm text-text-muted">This month</p>
      </div>

      <div className="my-4 flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-h3 font-semibold text-primary">
          {topSalesExecutive.name.charAt(0)}
        </span>
        <div>
          <p className="text-body-lg text-text-primary">
            {topSalesExecutive.name}
          </p>
          <p className="text-caption">{topSalesExecutive.location}</p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <div>
          <p className="text-caption">Deals Closed</p>
          <p className="text-h3 tabular-nums">
            {topSalesExecutive.dealsClosed}
          </p>
        </div>
        <div className="text-right">
          <p className="text-caption">Revenue</p>
          <p className="text-h3 tabular-nums text-primary">
            AED {(topSalesExecutive.revenue / 1000).toFixed(0)}K
          </p>
        </div>
      </div>
    </Card>
  );
}
