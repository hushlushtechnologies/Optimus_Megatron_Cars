"use client";

import { useFormContext, Controller, useWatch } from "react-hook-form";
import { ShieldCheck, BadgeCheck } from "lucide-react";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Select } from "@/src/components/ui/select";
import { Switch } from "@/src/components/ui/switch";
import type { AddCarDraftValues } from "@/src/lib/validation/car";
import type { AddCarLookups } from "@/src/lib/supabase/inventory-lookups";

interface WarrantyInspectionSectionProps {
  warrantyTypes: AddCarLookups["warrantyTypes"];
}

const INSPECTION_STATUS_OPTIONS = ["Not Inspected", "Scheduled", "Passed", "Failed"].map((v) => ({
  value: v,
  label: v,
}));

export function WarrantyInspectionSection({ warrantyTypes }: WarrantyInspectionSectionProps) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<AddCarDraftValues>();

  const warrantyAvailable = useWatch({ control, name: "warranty_available" });
  const megatronCertified = useWatch({ control, name: "megatron_certified" });

  return (
    <Card id="warranty-inspection" padding="lg" className="scroll-mt-24">
      <h2 className="text-h3">Warranty &amp; Inspection</h2>
      <p className="text-body-sm text-text-muted mt-1 mb-6">
        Warranty coverage and inspection status for this vehicle.
      </p>

      {/* Warranty */}
      <div>
        <Controller
          control={control}
          name="warranty_available"
          render={({ field }) => (
            <Switch
              label="Warranty Available"
              description="Turn on to add coverage details below."
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />

        {warrantyAvailable && (
          <div className="border-border mt-4 grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="warranty_type_id"
              render={({ field }) => (
                <Select
                  label="Warranty Type"
                  placeholder="Select warranty type"
                  options={warrantyTypes.map((w) => ({
                    value: w.id,
                    label: w.name,
                  }))}
                  {...field}
                  value={field.value ?? ""}
                />
              )}
            />
            <Input
              label="Warranty Provider"
              placeholder="e.g. Optimus Megatron Cars"
              {...register("warranty_provider")}
            />
            <Input label="Warranty Start Date" type="date" {...register("warranty_start_date")} />
            <Input
              label="Warranty Expiry Date"
              type="date"
              error={errors.warranty_expiry_date?.message}
              {...register("warranty_expiry_date")}
            />
            <Input label="Mileage Limit (km)" type="number" {...register("warranty_mileage_limit")} />
            <div className="sm:col-span-2">
              <Textarea
                label="Warranty Notes"
                placeholder="Any additional coverage detail..."
                {...register("warranty_notes")}
              />
            </div>
          </div>
        )}
      </div>

      {/* Inspection */}
      <div className="border-border mt-6 border-t pt-6">
        <div className="flex items-start gap-3">
          <span className="bg-primary/10 text-primary mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full">
            {megatronCertified ? (
              <BadgeCheck className="size-4.5" aria-hidden="true" />
            ) : (
              <ShieldCheck className="size-4.5" aria-hidden="true" />
            )}
          </span>
          <Controller
            control={control}
            name="megatron_certified"
            render={({ field }) => (
              <Switch
                label="Megatron Certified"
                description="Marks this vehicle as having passed Optimus Megatron's certified inspection program."
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="inspection_status"
            render={({ field }) => (
              <Select label="Inspection Status" options={INSPECTION_STATUS_OPTIONS} {...field} />
            )}
          />
          <Input label="Inspection Date" type="date" {...register("inspection_date")} />
          <Input
            label="Inspection Score (0–100)"
            type="number"
            min={0}
            max={100}
            error={errors.inspection_score?.message}
            {...register("inspection_score")}
          />
          <div className="sm:col-span-2">
            <Textarea
              label="Inspection Notes"
              placeholder="Findings, remarks, or areas checked..."
              {...register("inspection_notes")}
            />
          </div>
        </div>

        <p className="text-caption text-text-subtle mt-3">
          Inspection certificate upload arrives with Media Management (Sprint 2 Phase 11).
        </p>
      </div>
    </Card>
  );
}
