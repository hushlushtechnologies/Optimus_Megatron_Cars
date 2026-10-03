import { formatDistanceToNow } from "date-fns";
import { DollarSign, Tag, Archive, ArchiveRestore, PlusCircle } from "lucide-react";
import { DetailSection, DetailRow } from "@/src/components/inventory/view-car/detail-row";
import type { ActivityEntry } from "@/src/lib/supabase/inventory-detail-queries";
import type { CarDetail } from "@/src/lib/types/car-detail";

interface AuditTabProps {
  car: Pick<CarDetail, "created_at" | "updated_at">;
  createdByName: string;
  updatedByName: string;
  activity: ActivityEntry[];
}

const TYPE_ICON: Record<ActivityEntry["type"], React.ComponentType<{ className?: string }>> = {
  created: PlusCircle,
  price: DollarSign,
  status: Tag,
  archive: Archive,
};

export function AuditTab({ car, createdByName, updatedByName, activity }: AuditTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <DetailSection title="Record Info">
        <DetailRow label="Created By" value={createdByName} />
        <DetailRow
          label="Created At"
          value={formatDistanceToNow(new Date(car.created_at), {
            addSuffix: true,
          })}
        />
        <DetailRow label="Updated By" value={updatedByName} />
        <DetailRow
          label="Updated At"
          value={formatDistanceToNow(new Date(car.updated_at), {
            addSuffix: true,
          })}
        />
      </DetailSection>

      <div className="surface-card p-5">
        <p className="text-label mb-1">Activity Timeline</p>
        <p className="text-caption text-text-subtle mb-3">
          Every recorded price, status, and archive change for this vehicle.
        </p>

        {activity.length === 0 ? (
          <p className="text-body-sm text-text-muted">No activity recorded yet.</p>
        ) : (
          <ol className="border-border relative flex flex-col gap-5 border-l pl-4">
            {activity.map((entry) => {
              const Icon =
                entry.type === "archive" && entry.description.includes("restored")
                  ? ArchiveRestore
                  : TYPE_ICON[entry.type];

              return (
                <li key={entry.id} className="relative">
                  <span className="bg-card-hover text-primary absolute top-0.5 -left-[25px] flex size-5 items-center justify-center rounded-full">
                    <Icon className="size-3" aria-hidden="true" />
                  </span>
                  <p className="text-body-sm text-text-primary">{entry.description}</p>
                  <p className="text-caption text-text-subtle mt-0.5">
                    {entry.changedByName} ·{" "}
                    {formatDistanceToNow(new Date(entry.changedAt), {
                      addSuffix: true,
                    })}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
