import { getLeadActivity } from "@/src/lib/supabase/lead-activity-queries";
import { LeadActivityTimeline } from "@/src/components/leads/lead-activity-timeline";

export async function ActivityTab({ leadId }: { leadId: string }) {
  const entries = await getLeadActivity(leadId);
  return <LeadActivityTimeline entries={entries} />;
}
