"use server";

import { getLeadAssignmentHistory } from "@/src/lib/supabase/lead-detail-queries";

export async function getLeadAssignmentHistoryAction(leadId: string) {
  return getLeadAssignmentHistory(leadId);
}
