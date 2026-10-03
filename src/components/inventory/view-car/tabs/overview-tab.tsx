import { DetailSection, DetailRow } from "@/src/components/inventory/view-car/detail-row";
import type { CarDetail } from "@/src/lib/types/car-detail";

export function OverviewTab({ car }: { car: CarDetail }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <DetailSection title="Identity">
        <DetailRow label="Brand" value={car.brand?.name} />
        <DetailRow label="Model" value={car.model?.name} />
        <DetailRow label="Variant" value={car.variant?.name ?? car.variant_text} />
        <DetailRow label="Manufacturing Year" value={car.manufacturing_year} />
        <DetailRow label="VIN / Chassis Number" value={car.vin} />
        <DetailRow label="Registration Number" value={car.registration_number} />
        <DetailRow label="Visible on Website" value={car.show_registration_number ? "Yes" : "No"} />
        <DetailRow label="Location" value={car.location?.name} />
        <DetailRow label="Regional Specification" value={car.regional_spec} />
        <DetailRow label="Car Condition" value={car.car_condition} />
      </DetailSection>

      <DetailSection title="Specifications">
        <DetailRow
          label="Mileage"
          value={car.mileage_km !== null ? `${car.mileage_km.toLocaleString()} km` : null}
        />
        <DetailRow label="Fuel Type" value={car.fuel_type?.name} />
        <DetailRow label="Transmission" value={car.transmission?.name} />
        <DetailRow label="Drive Type" value={car.drive_type?.name} />
        <DetailRow label="Body Type" value={car.body_type?.name} />
        <DetailRow label="Engine" value={car.engine} />
        <DetailRow
          label="Engine Capacity"
          value={car.engine_capacity_cc ? `${car.engine_capacity_cc} cc` : null}
        />
        <DetailRow label="Cylinders" value={car.cylinders} />
        <DetailRow label="Horsepower" value={car.horsepower ? `${car.horsepower} hp` : null} />
        <DetailRow label="Torque" value={car.torque_nm ? `${car.torque_nm} Nm` : null} />
        <DetailRow label="Doors / Seats" value={`${car.doors ?? "—"} / ${car.seats ?? "—"}`} />
        <DetailRow label="Number of Keys" value={car.number_of_keys} />
        <DetailRow label="Units (Available / Total)" value={`${car.available_units} / ${car.total_units}`} />
      </DetailSection>

      {car.car_condition_description && (
        <div className="surface-card p-5 lg:col-span-2">
          <p className="text-label mb-2">Condition Notes</p>
          <p className="text-body-sm text-text-primary">{car.car_condition_description}</p>
        </div>
      )}
    </div>
  );
}
