import { getCustomerCommunications } from "@/src/lib/supabase/customer-communications-queries";
import { CommunicationsList } from "@/src/components/customers/communications-list";

export async function CommunicationsTab({ customerId }: { customerId: string }) {
  const communications = await getCustomerCommunications(customerId);
  return <CommunicationsList customerId={customerId} communications={communications} />;
}
