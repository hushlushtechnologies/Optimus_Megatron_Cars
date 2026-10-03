"use client";

import { useFormContext, Controller, useWatch } from "react-hook-form";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Select } from "@/src/components/ui/select";
import { Switch } from "@/src/components/ui/switch";
import { Divider } from "@/src/components/ui/divider";
import { computePricePreview } from "@/src/lib/utils/price-preview";
import type { AddCarDraftValues } from "@/src/lib/validation/car";
import type { PromotionLookup } from "@/src/lib/supabase/inventory-lookups";

interface PricingPromotionSectionProps {
  promotions: PromotionLookup[];
}

function formatAED(value: number) {
  return `AED ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function PricingPromotionSection({ promotions }: PricingPromotionSectionProps) {
  const { register, control } = useFormContext<AddCarDraftValues>();

  const regularPrice = useWatch({ control, name: "regular_price" });
  const promotionId = useWatch({ control, name: "promotion_id" });
  const selectedPromotion = promotions.find((p) => p.id === promotionId);
  const preview = computePricePreview(regularPrice, selectedPromotion);

  return (
    <Card id="pricing-promotion" padding="lg" className="scroll-mt-24">
      <h2 className="text-h3">Pricing &amp; Promotion</h2>
      <p className="text-body-sm text-text-muted mt-1 mb-6">
        Set the listing price and apply an active promotion if one applies.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Regular Price (AED)"
          type="number"
          placeholder="e.g. 720000"
          {...register("regular_price")}
        />

        <Controller
          control={control}
          name="promotion_id"
          render={({ field }) => (
            <Select
              label="Promotion"
              placeholder="No Promotion"
              options={promotions.map((p) => ({ value: p.id, label: p.name }))}
              {...field}
              value={field.value ?? ""}
            />
          )}
        />
      </div>

      {preview && (
        <div className="surface-card mt-4 flex flex-col gap-2 p-4">
          <div className="text-body-sm flex items-center justify-between">
            <span className="text-text-muted">Original Price</span>
            <span className="text-text-primary tabular-nums">{formatAED(preview.original)}</span>
          </div>
          <div className="text-body-sm flex items-center justify-between">
            <span className="text-text-muted">Discount ({preview.discountLabel})</span>
            <span className="text-red-400 tabular-nums">
              {preview.discountAmount > 0 ? `− ${formatAED(preview.discountAmount)}` : "—"}
            </span>
          </div>
          <Divider />
          <div className="flex items-center justify-between">
            <span className="text-body-sm text-text-primary font-medium">Final Price</span>
            <span className="text-h3 text-primary-text tabular-nums">{formatAED(preview.final)}</span>
          </div>
        </div>
      )}

      <div className="border-border mt-6 flex flex-col gap-4 border-t pt-6 sm:grid sm:grid-cols-2 sm:gap-4">
        <Controller
          control={control}
          name="finance_available"
          render={({ field }) => (
            <Switch label="Finance Available" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
        <Controller
          control={control}
          name="reservation_available"
          render={({ field }) => (
            <Switch label="Reservation Available" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
        <Controller
          control={control}
          name="trade_in_available"
          render={({ field }) => (
            <Switch label="Trade-In Available" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </div>

      <div className="mt-4">
        <Input
          label="Reservation Token Override"
          type="number"
          placeholder="Leave blank to use the global reservation amount"
          {...register("reservation_token_override")}
        />
      </div>
    </Card>
  );
}
