import { computePricePreview } from "@/src/lib/utils/price-preview";
import { DetailSection, DetailRow } from "@/src/components/inventory/view-car/detail-row";
import type { CarDetail } from "@/src/lib/types/car-detail";

function formatAED(value: number) {
  return `AED ${value.toLocaleString()}`;
}

export function PricingTab({ car }: { car: CarDetail }) {
  const preview = computePricePreview(
    car.regular_price,
    car.promotion
      ? {
          id: "",
          name: car.promotion.name,
          discount_type: car.promotion.discount_type,
          discount_value: car.promotion.discount_value,
        }
      : undefined,
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <DetailSection title="Pricing">
        <DetailRow
          label="Regular Price"
          value={car.regular_price !== null ? formatAED(car.regular_price) : null}
        />
        <DetailRow label="Promotion" value={car.promotion?.name ?? "No Promotion"} />
        {preview && preview.discountAmount > 0 && (
          <DetailRow
            label="Final Price"
            value={<span className="text-primary-text">{formatAED(preview.final)}</span>}
          />
        )}
        <DetailRow label="Finance Available" value={car.finance_available ? "Yes" : "No"} />
        <DetailRow label="Reservation Available" value={car.reservation_available ? "Yes" : "No"} />
        <DetailRow
          label="Reservation Token Override"
          value={
            car.reservation_token_override !== null
              ? formatAED(car.reservation_token_override)
              : "Uses global default"
          }
        />
        <DetailRow label="Trade-In Available" value={car.trade_in_available ? "Yes" : "No"} />
      </DetailSection>
    </div>
  );
}
