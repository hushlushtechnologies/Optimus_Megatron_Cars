import { ActivityTimeline } from "@/src/components/customers/activity-timeline";
import { getCustomerActivity } from "@/src/lib/supabase/customer-detail-queries";

export async function ActivityTab({ customerId }: { customerId: string }) {
  const entries = await getCustomerActivity(customerId);
  return <ActivityTimeline entries={entries} emptyLabel="No activity recorded yet." />;
}
