import { ActivityTimeline } from "@/src/components/customers/activity-timeline";
import { getCustomerActivity } from "@/src/lib/supabase/customer-detail-queries";
import { isAuditableActivity } from "@/src/lib/utils/customer-activity-types";

export async function AuditTrailTab({ customerId }: { customerId: string }) {
  const entries = await getCustomerActivity(customerId);
  const auditable = entries.filter((e) => isAuditableActivity(e.activity_type));

  return (
    <div className="flex flex-col gap-3">
      <p className="text-body-sm text-text-muted">
        Field, status, staff, and relationship changes — a compliance-focused subset of the full Activity
        feed.
      </p>
      <ActivityTimeline entries={auditable} emptyLabel="No auditable changes recorded yet." />
    </div>
  );
}
