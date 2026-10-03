"use client";

import { Controller, useFormContext } from "react-hook-form";

import { Card } from "@/src/components/ui/card";
import { ColorPicker } from "@/src/components/ui/color-picker";
import { Input } from "@/src/components/ui/input";
import { Select } from "@/src/components/ui/select";

import type { AddCarDraftValues } from "@/src/lib/validation/car";
import type { AddCarLookups } from "@/src/lib/supabase/inventory-lookups";

interface ExteriorInteriorSectionProps {
  lookups: Pick<AddCarLookups, "paintFinishes">;
}

export function ExteriorInteriorSection({ lookups }: ExteriorInteriorSectionProps) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<AddCarDraftValues>();

  return (
    <Card id="exterior-interior" padding="lg" className="scroll-mt-24">
      {/* Section header */}
      <div className="mb-6">
        <h2 className="text-h3 text-text-primary">Exterior &amp; Interior</h2>

        <p className="text-body-sm text-text-muted mt-1">
          Color, paint, and cabin finish details for this vehicle.
        </p>
      </div>

      <div className="space-y-8">
        {/* =====================================================
            EXTERIOR
        ===================================================== */}

        <div>
          <div className="mb-4 flex items-center gap-3">
            <h3 className="text-body-sm text-text-primary shrink-0 font-medium">Exterior</h3>

            <div className="bg-border/70 h-px flex-1" />
          </div>

          <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Controller
                control={control}
                name="exterior_color_hex"
                render={({ field: hexField }) => (
                  <Controller
                    control={control}
                    name="exterior_color_name"
                    render={({ field: nameField }) => (
                      <ColorPicker
                        label="Exterior Color"
                        value={hexField.value ?? ""}
                        onChange={hexField.onChange}
                        colorName={nameField.value ?? ""}
                        onColorNameChange={nameField.onChange}
                        error={errors.exterior_color_hex?.message}
                        hint="Choose the closest representation of the vehicle's exterior color."
                      />
                    )}
                  />
                )}
              />
            </div>

            <Controller
              control={control}
              name="paint_finish_id"
              render={({ field }) => (
                <Select
                  label="Paint Finish"
                  placeholder="Select paint finish"
                  options={lookups.paintFinishes.map((paint) => ({
                    value: paint.id,
                    label: paint.name,
                  }))}
                  name={field.name}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  disabled={field.disabled}
                  error={errors.paint_finish_id?.message}
                />
              )}
            />
          </div>
        </div>

        {/* =====================================================
            INTERIOR
        ===================================================== */}

        <div>
          <div className="mb-4 flex items-center gap-3">
            <h3 className="text-body-sm text-text-primary shrink-0 font-medium">Interior</h3>

            <div className="bg-border/70 h-px flex-1" />
          </div>

          <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Controller
                control={control}
                name="interior_color_hex"
                render={({ field: hexField }) => (
                  <Controller
                    control={control}
                    name="interior_color_name"
                    render={({ field: nameField }) => (
                      <ColorPicker
                        label="Interior Color"
                        value={hexField.value ?? ""}
                        onChange={hexField.onChange}
                        colorName={nameField.value ?? ""}
                        onColorNameChange={nameField.onChange}
                        error={errors.interior_color_hex?.message}
                        hint="Choose the primary color used throughout the cabin."
                      />
                    )}
                  />
                )}
              />
            </div>

            <Input
              label="Interior Material"
              placeholder="e.g. Nappa Leather"
              error={errors.interior_material?.message}
              {...register("interior_material")}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
