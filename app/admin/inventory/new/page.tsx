import { getAddCarLookups, getCarDraft } from "@/src/lib/supabase/inventory-lookups";
import { getCarMedia } from "@/src/lib/supabase/media-queries";
import { AddCarForm } from "@/src/components/inventory/add-car/add-car-form";
import type { AddCarDraftValues } from "@/src/lib/validation/car";

interface NewCarPageProps {
  searchParams: Promise<{ carId?: string }>;
}

export default async function NewCarPage({ searchParams }: NewCarPageProps) {
  const params = await searchParams;
  const carId = params.carId ?? null;

  const [lookups, existingCar, media] = await Promise.all([
    getAddCarLookups(),
    carId ? getCarDraft(carId) : Promise.resolve(null),
    carId ? getCarMedia(carId) : Promise.resolve([]),
  ]);

  const initialValues: Partial<AddCarDraftValues> | null = existingCar
    ? {
        display_title: existingCar.display_title,
        brand_id: existingCar.brand_id ?? "",
        model_id: existingCar.model_id ?? "",
        variant_id: existingCar.variant_id,
        manufacturing_year: existingCar.manufacturing_year,
        stock_id: existingCar.stock_id,
        vin: existingCar.vin ?? "",
        location_id: existingCar.location_id ?? "",
        collection_id: existingCar.collection_id ?? "",
        availability_status_id: existingCar.availability_status_id ?? "",
        car_condition: existingCar.car_condition ?? "",
        car_condition_description: existingCar.car_condition_description ?? "",
        regional_spec: existingCar.regional_spec ?? "",
        registration_number: existingCar.registration_number ?? "",
        show_registration_number: existingCar.show_registration_number,
        mileage_km: existingCar.mileage_km,
        fuel_type_id: existingCar.fuel_type_id ?? "",
        transmission_id: existingCar.transmission_id ?? "",
        drive_type_id: existingCar.drive_type_id ?? "",
        body_type_id: existingCar.body_type_id ?? "",
        engine: existingCar.engine ?? "",
        engine_capacity_cc: existingCar.engine_capacity_cc,
        cylinders: existingCar.cylinders,
        horsepower: existingCar.horsepower,
        torque_nm: existingCar.torque_nm,
        doors: existingCar.doors,
        seats: existingCar.seats,
        number_of_keys: existingCar.number_of_keys,
        total_units: existingCar.total_units,
        available_units: existingCar.available_units,
        exterior_color_name: existingCar.exterior_color_name ?? "",
        exterior_color_hex: existingCar.exterior_color_hex ?? "#FFFFFF",
        paint_finish_id: existingCar.paint_finish_id ?? "",
        interior_color_name: existingCar.interior_color_name ?? "",
        interior_color_hex: existingCar.interior_color_hex ?? "#000000",
        interior_material: existingCar.interior_material ?? "",
        regular_price: existingCar.regular_price,
        finance_available: existingCar.finance_available,
        reservation_available: existingCar.reservation_available,
        reservation_token_override: existingCar.reservation_token_override,
        promotion_id: existingCar.promotion_id ?? "",
        trade_in_available: existingCar.trade_in_available,
        warranty_available: existingCar.warranty_available,
        warranty_type_id: existingCar.warranty_type_id ?? "",
        warranty_provider: existingCar.warranty_provider ?? "",
        warranty_start_date: existingCar.warranty_start_date ?? "",
        warranty_expiry_date: existingCar.warranty_expiry_date ?? "",
        warranty_mileage_limit: existingCar.warranty_mileage_limit,
        warranty_notes: existingCar.warranty_notes ?? "",
        megatron_certified: existingCar.megatron_certified,
        inspection_status: existingCar.inspection_status,
        inspection_date: existingCar.inspection_date ?? "",
        inspection_score: existingCar.inspection_score,
        inspection_notes: existingCar.inspection_notes ?? "",
        slug: existingCar.slug,
        featured: existingCar.featured,
        new_arrival: existingCar.new_arrival,
        coming_soon: existingCar.coming_soon,
        show_on_homepage: existingCar.show_on_homepage,
        publish_date: existingCar.publish_date ?? "",
        seo_title: existingCar.seo_title ?? "",
        seo_description: existingCar.seo_description ?? "",
      }
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-h1">Add Car</h1>
        <p className="text-body-sm text-text-muted">
          All sections are live — fill in what you need and publish when ready.
        </p>
      </div>
      <AddCarForm
        mode="create"
        carId={carId}
        initialValues={initialValues}
        initialLookups={lookups}
        initialMedia={media}
      />
    </div>
  );
}
