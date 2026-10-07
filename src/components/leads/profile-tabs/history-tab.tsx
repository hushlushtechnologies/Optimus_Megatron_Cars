import { getLeadActivity } from "@/src/lib/supabase/lead-activity-queries";
import { LeadActivityTimeline } from "@/src/components/leads/lead-activity-timeline";
import { isAuditableLeadActivity } from "@/src/lib/utils/lead-activity-types";

export async function HistoryTab({ leadId }: { leadId: string }) {
  const entries = await getLeadActivity(leadId);
  const auditable = entries.filter((e) => isAuditableLeadActivity(e.activity_type));

  return (
    <div className="flex flex-col gap-3">
      <p className="text-body-sm text-text-muted">
        Stage, staff, temperature, and tag changes — a compliance-focused subset of the full Activity feed.
      </p>
      <LeadActivityTimeline entries={auditable} emptyLabel="No auditable changes recorded yet." />
    </div>
  );
}
