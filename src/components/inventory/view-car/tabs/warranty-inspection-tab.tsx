import { ShieldCheck, BadgeCheck } from "lucide-react";
import { DetailSection, DetailRow } from "@/src/components/inventory/view-car/detail-row";
import type { CarDetail } from "@/src/lib/types/car-detail";

export function WarrantyInspectionTab({ car }: { car: CarDetail }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <DetailSection title="Warranty">
        <DetailRow
          label="Available"
          value={
            <span className="flex items-center gap-1.5">
              <ShieldCheck
                className={car.warranty_available ? "size-4 text-emerald-400" : "text-text-subtle size-4"}
                aria-hidden="true"
              />
              {car.warranty_available ? "Yes" : "No"}
            </span>
          }
        />
        {car.warranty_available && (
          <>
            <DetailRow label="Type" value={car.warranty_type?.name} />
            <DetailRow label="Provider" value={car.warranty_provider} />
            <DetailRow label="Start Date" value={car.warranty_start_date} />
            <DetailRow label="Expiry Date" value={car.warranty_expiry_date} />
            <DetailRow
              label="Mileage Limit"
              value={car.warranty_mileage_limit ? `${car.warranty_mileage_limit.toLocaleString()} km` : null}
            />
            <DetailRow label="Notes" value={car.warranty_notes} />
          </>
        )}
      </DetailSection>

      <DetailSection title="Inspection">
        <DetailRow
          label="Megatron Certified"
          value={
            <span className="flex items-center gap-1.5">
              <BadgeCheck
                className={car.megatron_certified ? "text-primary size-4" : "text-text-subtle size-4"}
                aria-hidden="true"
              />
              {car.megatron_certified ? "Yes" : "No"}
            </span>
          }
        />
        <DetailRow label="Status" value={car.inspection_status} />
        <DetailRow label="Date" value={car.inspection_date} />
        <DetailRow
          label="Score"
          value={car.inspection_score !== null ? `${car.inspection_score} / 100` : null}
        />
        <DetailRow label="Notes" value={car.inspection_notes} />
        <DetailRow
          label="Certificate"
          value={car.inspection_certificate_url ? "Uploaded" : "Not yet available"}
        />
      </DetailSection>
    </div>
  );
}
