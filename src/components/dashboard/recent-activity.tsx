import { Circle } from "lucide-react";
import { Card } from "@/src/components/ui/card";
import { recentActivity } from "@/src/lib/mock-data/dashboard";

export function RecentActivity() {
  return (
    <Card variant="elevated" padding="lg" className="h-full">
      <h3 className="mb-4 text-h3">Recent Activity</h3>
      <ol className="relative flex flex-col gap-5 border-l border-border pl-4">
        {recentActivity.map((item) => (
          <li key={item.id} className="relative">
            <Circle
              aria-hidden="true"
              className="absolute -left-[21px] top-1 size-2.5 fill-primary text-primary"
            />
            <p className="text-body-sm text-text-primary">{item.label}</p>
            <p className="text-caption">{item.detail}</p>
            <p className="mt-0.5 text-caption text-text-subtle">{item.time}</p>
          </li>
        ))}
      </ol>
    </Card>
  );
}
