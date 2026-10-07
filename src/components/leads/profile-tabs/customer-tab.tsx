import Link from "next/link";
import { DetailSection, DetailRow } from "@/src/components/inventory/view-car/detail-row";
import type { LeadSummary } from "@/src/lib/types/lead";

export function CustomerTab({ lead }: { lead: LeadSummary }) {
  return (
    <DetailSection title="Customer">
      <DetailRow label="Name" value={lead.customer.full_name} />
      <DetailRow label="Customer ID" value={lead.customer.customer_number} />
      <DetailRow label="Phone" value={lead.customer.phone} />
      <div className="pt-2">
        <Link
          href={`/admin/customers/${lead.customer.id}`}
          className="text-body-sm text-primary-text hover:text-primary-hover"
        >
          View full customer profile →
        </Link>
      </div>
    </DetailSection>
  );
}
