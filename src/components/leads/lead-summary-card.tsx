import Link from "next/link";
import { DetailSection, DetailRow } from "@/src/components/inventory/view-car/detail-row";
import type { LeadSummary } from "@/src/lib/types/lead";

export function LeadSummaryCard({ lead }: { lead: LeadSummary }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <DetailSection title="Customer">
        <DetailRow
          label="Name"
          value={
            <Link
              href={`/admin/customers/${lead.customer.id}`}
              className="text-primary-text hover:text-primary-hover"
            >
              {lead.customer.full_name}
            </Link>
          }
        />
        <DetailRow label="Customer ID" value={lead.customer.customer_number} />
        <DetailRow label="Phone" value={lead.customer.phone} />
      </DetailSection>

      <DetailSection title="Vehicle">
        {lead.vehicle ? (
          <>
            <DetailRow
              label="Vehicle"
              value={
                <Link
                  href={`/admin/inventory/${lead.vehicle.id}`}
                  className="text-primary-text hover:text-primary-hover"
                >
                  {lead.vehicle.display_title}
                </Link>
              }
            />
            <DetailRow label="Brand" value={lead.vehicle.brand_name} />
            <DetailRow label="Stock ID" value={lead.vehicle.stock_id} />
          </>
        ) : (
          <p className="text-body-sm text-text-muted">No specific vehicle linked yet.</p>
        )}
      </DetailSection>
    </div>
  );
}
