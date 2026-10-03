"use client";

import { useFormContext, Controller } from "react-hook-form";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Select } from "@/src/components/ui/select";
import type { AddCarDraftValues } from "@/src/lib/validation/car";
import type { AddCarLookups } from "@/src/lib/supabase/inventory-lookups";

interface SpecificationsSectionProps {
  lookups: Pick<AddCarLookups, "fuelTypes" | "transmissionTypes" | "driveTypes" | "bodyTypes">;
}

export function SpecificationsSection({ lookups }: SpecificationsSectionProps) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<AddCarDraftValues>();

  return (
    <Card id="specifications" padding="lg" className="scroll-mt-24">
      <h2 className="text-h3">Vehicle Specifications</h2>
      <p className="text-body-sm text-text-muted mt-1 mb-6">
        Mechanical and physical details for this vehicle.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Input
          label="Mileage / KM Driven"
          type="number"
          placeholder="e.g. 4500"
          error={errors.mileage_km?.message}
          {...register("mileage_km")}
        />

        <Controller
          control={control}
          name="fuel_type_id"
          render={({ field }) => (
            <Select
              label="Fuel Type"
              placeholder="Select fuel type"
              options={lookups.fuelTypes.map((f) => ({
                value: f.id,
                label: f.name,
              }))}
              {...field}
              value={field.value ?? ""}
            />
          )}
        />

        <Controller
          control={control}
          name="transmission_id"
          render={({ field }) => (
            <Select
              label="Transmission"
              placeholder="Select transmission"
              options={lookups.transmissionTypes.map((t) => ({
                value: t.id,
                label: t.name,
              }))}
              {...field}
              value={field.value ?? ""}
            />
          )}
        />

        <Controller
          control={control}
          name="drive_type_id"
          render={({ field }) => (
            <Select
              label="Drive Type"
              placeholder="Select drive type"
              options={lookups.driveTypes.map((d) => ({
                value: d.id,
                label: d.name,
              }))}
              {...field}
              value={field.value ?? ""}
            />
          )}
        />

        <Controller
          control={control}
          name="body_type_id"
          render={({ field }) => (
            <Select
              label="Body Type"
              placeholder="Select body type"
              options={lookups.bodyTypes.map((b) => ({
                value: b.id,
                label: b.name,
              }))}
              {...field}
              value={field.value ?? ""}
            />
          )}
        />

        <Input label="Engine" placeholder="e.g. 4.0L Twin-Turbo V8" {...register("engine")} />
        <Input label="Engine Capacity (cc)" type="number" {...register("engine_capacity_cc")} />
        <Input label="Cylinders" type="number" {...register("cylinders")} />
        <Input label="Horsepower (hp)" type="number" {...register("horsepower")} />
        <Input label="Torque (Nm)" type="number" {...register("torque_nm")} />
        <Input label="Doors" type="number" {...register("doors")} />
        <Input label="Seats" type="number" {...register("seats")} />
        <Input label="Number of Keys" type="number" {...register("number_of_keys")} />

        <Input
          label="Total Units"
          type="number"
          min={0}
          error={errors.total_units?.message}
          {...register("total_units")}
        />
        <Input
          label="Available Units"
          type="number"
          min={0}
          error={errors.available_units?.message}
          {...register("available_units")}
        />
      </div>
    </Card>
  );
}
