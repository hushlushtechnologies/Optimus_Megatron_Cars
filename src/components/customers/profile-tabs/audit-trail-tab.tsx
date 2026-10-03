import { ActivityTimeline } from "@/src/components/customers/activity-timeline";
import { getCustomerActivity } from "@/src/lib/supabase/customer-detail-queries";

export async function AuditTrailTab({ customerId }: { customerId: string }) {
  const entries = await getCustomerActivity(customerId);
  const changes = entries.filter((e) => e.old_value !== null || e.new_value !== null);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-body-sm text-text-muted">
        Field-level changes only — Primary Relationship Manager, and any future auditable field changes.
      </p>
      <ActivityTimeline entries={changes} emptyLabel="No auditable changes recorded yet." />
    </div>
  );
}
