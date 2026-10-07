import Link from "next/link";
import { CarFront } from "lucide-react";
import { DetailSection, DetailRow } from "@/src/components/inventory/view-car/detail-row";
import type { LeadSummary } from "@/src/lib/types/lead";

export function VehicleTab({ lead }: { lead: LeadSummary }) {
  if (!lead.vehicle) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <CarFront className="text-text-subtle size-8" aria-hidden="true" />
        <div>
          <p className="text-body-lg text-text-primary">No vehicle linked yet</p>
          <p className="text-body-sm text-text-muted mt-1">
            This lead doesnt have a specific vehicle attached — thats fine, and can be added later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <DetailSection title="Vehicle of Interest">
      <DetailRow label="Vehicle" value={lead.vehicle.display_title} />
      <DetailRow label="Brand" value={lead.vehicle.brand_name ?? "—"} />
      <DetailRow label="Stock ID" value={lead.vehicle.stock_id} />
      <div className="pt-2">
        <Link
          href={`/admin/inventory/${lead.vehicle.id}`}
          className="text-body-sm text-primary-text hover:text-primary-hover"
        >
          View full vehicle listing →
        </Link>
      </div>
    </DetailSection>
  );
}
