import { getLeadCommunications } from "@/src/lib/supabase/lead-communications-queries";
import { LeadCommunicationsList } from "@/src/components/leads/lead-communications-list";

export async function CommunicationsTab({ leadId, customerId }: { leadId: string; customerId: string }) {
  const communications = await getLeadCommunications(leadId);
  return <LeadCommunicationsList leadId={leadId} customerId={customerId} communications={communications} />;
}
