import { DetailSection, DetailRow } from "@/src/components/inventory/view-car/detail-row";
import type { CarDetail } from "@/src/lib/types/car-detail";

export function ExteriorInteriorTab({ car }: { car: CarDetail }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <DetailSection title="Exterior">
        <DetailRow
          label="Color"
          value={
            car.exterior_color_name ? (
              <span className="flex items-center gap-2">
                {car.exterior_color_hex && (
                  <span
                    aria-hidden="true"
                    className="border-border size-3.5 rounded-full border"
                    style={{ backgroundColor: car.exterior_color_hex }}
                  />
                )}
                {car.exterior_color_name}
              </span>
            ) : null
          }
        />
        <DetailRow label="Hex" value={car.exterior_color_hex} />
        <DetailRow label="Paint Finish" value={car.paint_finish?.name} />
      </DetailSection>

      <DetailSection title="Interior">
        <DetailRow
          label="Color"
          value={
            car.interior_color_name ? (
              <span className="flex items-center gap-2">
                {car.interior_color_hex && (
                  <span
                    aria-hidden="true"
                    className="border-border size-3.5 rounded-full border"
                    style={{ backgroundColor: car.interior_color_hex }}
                  />
                )}
                {car.interior_color_name}
              </span>
            ) : null
          }
        />
        <DetailRow label="Hex" value={car.interior_color_hex} />
        <DetailRow label="Material" value={car.interior_material} />
      </DetailSection>
    </div>
  );
}
