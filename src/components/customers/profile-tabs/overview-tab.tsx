import { DetailSection, DetailRow } from "@/src/components/inventory/view-car/detail-row";

import type { CustomerDetail } from "@/src/lib/supabase/customer-detail-queries";

interface OverviewTabProps {
  customer: CustomerDetail;
}

export function OverviewTab({ customer }: OverviewTabProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <DetailSection title="Profile">
        <DetailRow label="First Name" value={customer.first_name} />
        <DetailRow label="Last Name" value={customer.last_name} />
        <DetailRow label="Address" value={customer.address} />
        <DetailRow label="Location" value={customer.location?.name ?? "Not specified"} />
        <DetailRow label="Preferred Language" value={customer.preferred_language} />
      </DetailSection>

      <DetailSection title="Relationship">
        <DetailRow label="Source" value={customer.source?.name ?? "Not specified"} />
        <DetailRow label="Source Detail" value={customer.source_detail} />
        <DetailRow label="Customer Status" value={customer.lifecycle_status} />
        <DetailRow label="Account Status" value={customer.account_status} />
        <DetailRow
          label="Last Activity"
          value={
            customer.last_activity_at
              ? new Date(customer.last_activity_at).toLocaleDateString()
              : "No activity recorded"
          }
        />
      </DetailSection>
    </div>
  );
}
