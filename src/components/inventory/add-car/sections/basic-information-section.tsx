"use client";

import { useFormContext, Controller } from "react-hook-form";
import { toast } from "sonner";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Select } from "@/src/components/ui/select";
import { Switch } from "@/src/components/ui/switch";
import { Combobox } from "@/src/components/ui/combobox";
import type { BasicInfoValues } from "@/src/lib/validation/car";
import type { AddCarLookups } from "@/src/lib/supabase/inventory-lookups";
import { createBrand, createModel, createVariant } from "@/app/admin/inventory/new/actions";

interface BasicInformationSectionProps {
  lookups: AddCarLookups;
  onLookupsChange: (updater: (prev: AddCarLookups) => AddCarLookups) => void;
}

const CONDITION_OPTIONS = ["Brand New", "Excellent", "Very Good", "Good", "Fair"].map((v) => ({
  value: v,
  label: v,
}));

const REGIONAL_SPEC_OPTIONS = ["GCC", "European", "American", "Japanese", "Other"].map((v) => ({
  value: v,
  label: v,
}));

export function BasicInformationSection({ lookups, onLookupsChange }: BasicInformationSectionProps) {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext<BasicInfoValues>();

  const brandId = watch("brand_id");
  const modelId = watch("model_id");

  const modelOptions = lookups.models.filter((m) => m.brand_id === brandId);
  const variantOptions = lookups.variants.filter((v) => v.model_id === modelId);

  return (
    <Card id="basic-information" padding="lg" className="scroll-mt-24">
      {/* Section header */}
      <div className="mb-6">
        <h2 className="text-h3 text-text-primary">Basic Information</h2>
        <p className="text-body-sm text-text-muted mt-1">Core identity details for this vehicle listing.</p>
      </div>

      <div className="space-y-8">
        {/* =====================================================
          VEHICLE IDENTITY
      ===================================================== */}

        <div>
          <div className="mb-4 flex items-center gap-3">
            <h3 className="text-body-sm text-text-primary shrink-0 font-medium">Vehicle identity</h3>
            <div className="bg-border/70 h-px flex-1" />
          </div>

          <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label="Vehicle Name / Display Title"
                placeholder="e.g. Porsche 911 GT3 Touring 2024"
                error={errors.display_title?.message}
                {...register("display_title")}
              />
            </div>

            <Controller
              control={control}
              name="brand_id"
              render={({ field }) => (
                <Combobox
                  label="Brand"
                  value={field.value || null}
                  onChange={(id) => field.onChange(id ?? "")}
                  options={lookups.brands.map((brand) => ({
                    id: brand.id,
                    label: brand.name,
                  }))}
                  error={errors.brand_id?.message}
                  onCreateNew={async (name) => {
                    const result = await createBrand(name);

                    if (result.error || !result.brand) {
                      toast.error(result.error ?? "Unable to create brand.");
                      throw new Error(result.error);
                    }

                    onLookupsChange((prev) => ({
                      ...prev,
                      brands: [...prev.brands, result.brand!],
                    }));

                    return {
                      id: result.brand.id,
                      label: result.brand.name,
                    };
                  }}
                />
              )}
            />

            <Controller
              control={control}
              name="model_id"
              render={({ field }) => (
                <Combobox
                  label="Model"
                  value={field.value || null}
                  onChange={(id) => field.onChange(id ?? "")}
                  options={modelOptions.map((model) => ({
                    id: model.id,
                    label: model.name,
                  }))}
                  disabled={!brandId}
                  disabledHint="Select a brand first"
                  error={errors.model_id?.message}
                  onCreateNew={
                    brandId
                      ? async (name) => {
                          const result = await createModel(brandId, name);

                          if (result.error || !result.model) {
                            toast.error(result.error ?? "Unable to create model.");
                            throw new Error(result.error);
                          }

                          onLookupsChange((prev) => ({
                            ...prev,
                            models: [...prev.models, result.model!],
                          }));

                          return {
                            id: result.model.id,
                            label: result.model.name,
                          };
                        }
                      : undefined
                  }
                />
              )}
            />

            <Controller
              control={control}
              name="variant_id"
              render={({ field }) => (
                <Combobox
                  label="Variant"
                  value={field.value || null}
                  onChange={(id) => field.onChange(id)}
                  options={variantOptions.map((variant) => ({
                    id: variant.id,
                    label: variant.name,
                  }))}
                  disabled={!modelId}
                  disabledHint="Select a model first"
                  onCreateNew={
                    modelId
                      ? async (name) => {
                          const result = await createVariant(modelId, name);

                          if (result.error || !result.variant) {
                            toast.error(result.error ?? "Unable to create variant.");
                            throw new Error(result.error);
                          }

                          onLookupsChange((prev) => ({
                            ...prev,
                            variants: [...prev.variants, result.variant!],
                          }));

                          return {
                            id: result.variant.id,
                            label: result.variant.name,
                          };
                        }
                      : undefined
                  }
                />
              )}
            />

            <Input
              label="Manufacturing Year"
              type="number"
              placeholder="e.g. 2026"
              error={errors.manufacturing_year?.message}
              {...register("manufacturing_year")}
            />
          </div>
        </div>

        {/* =====================================================
          STOCK & CLASSIFICATION
      ===================================================== */}

        <div>
          <div className="mb-4 flex items-center gap-3">
            <h3 className="text-body-sm text-text-primary shrink-0 font-medium">Stock & classification</h3>
            <div className="bg-border/70 h-px flex-1" />
          </div>

          <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
            <Input
              label="Stock ID"
              placeholder="e.g. OMC-1042"
              error={errors.stock_id?.message}
              {...register("stock_id")}
            />

            <Input
              label="VIN / Chassis Number"
              placeholder="Enter VIN or chassis number"
              error={errors.vin?.message}
              {...register("vin")}
            />

            <Controller
              control={control}
              name="location_id"
              render={({ field }) => (
                <Select
                  label="Location"
                  placeholder="Select a location"
                  options={lookups.locations.map((location) => ({
                    value: location.id,
                    label: location.name,
                  }))}
                  error={errors.location_id?.message}
                  {...field}
                />
              )}
            />

            <Controller
              control={control}
              name="collection_id"
              render={({ field }) => (
                <Select
                  label="Collection"
                  placeholder="No collection"
                  options={lookups.collections.map((collection) => ({
                    value: collection.id,
                    label: collection.name,
                  }))}
                  name={field.name}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  disabled={field.disabled}
                />
              )}
            />

            <Controller
              control={control}
              name="availability_status_id"
              render={({ field }) => (
                <Select
                  label="Car Status"
                  placeholder="Select a status"
                  options={lookups.availabilityStatuses.map((status) => ({
                    value: status.id,
                    label: status.name,
                  }))}
                  error={errors.availability_status_id?.message}
                  {...field}
                />
              )}
            />

            <Controller
              control={control}
              name="car_condition"
              render={({ field }) => (
                <Select
                  label="Car Condition"
                  placeholder="Select condition"
                  options={CONDITION_OPTIONS}
                  name={field.name}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  disabled={field.disabled}
                />
              )}
            />

            <div className="sm:col-span-2">
              <Textarea
                label="Car Condition Description"
                placeholder="Add any additional details about the vehicle's condition..."
                hint="Optional internal details about the vehicle's current condition."
                rows={3}
                {...register("car_condition_description")}
              />
            </div>
          </div>
        </div>

        {/* =====================================================
          REGISTRATION
      ===================================================== */}

        <div>
          <div className="mb-4 flex items-center gap-3">
            <h3 className="text-body-sm text-text-primary shrink-0 font-medium">Registration</h3>
            <div className="bg-border/70 h-px flex-1" />
          </div>

          <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="regional_spec"
              render={({ field }) => (
                <Select
                  label="Regional Specification"
                  placeholder="Select specification"
                  options={REGIONAL_SPEC_OPTIONS}
                  name={field.name}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  disabled={field.disabled}
                />
              )}
            />

            <Input
              label="Registration Number"
              placeholder="Enter registration number"
              hint="Visible to administrators by default."
              {...register("registration_number")}
            />

            <div className="sm:col-span-2">
              <div className="border-border bg-card-hover/30 rounded-lg border px-4 py-3.5">
                <Controller
                  control={control}
                  name="show_registration_number"
                  render={({ field }) => (
                    <Switch
                      label="Show Registration Number on Website"
                      description="Allow customers to see the registration number. It always remains visible to administrators."
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
