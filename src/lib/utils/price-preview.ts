import type { PromotionLookup } from "@/src/lib/supabase/inventory-lookups";

export interface PricePreview {
  original: number;
  discountAmount: number;
  final: number;
  discountLabel: string;
}

export function computePricePreview(
  regularPrice: number | null,
  promotion: PromotionLookup | undefined,
): PricePreview | null {
  if (regularPrice === null || regularPrice <= 0) return null;

  if (!promotion) {
    return {
      original: regularPrice,
      discountAmount: 0,
      final: regularPrice,
      discountLabel: "No promotion",
    };
  }

  const discountAmount =
    promotion.discount_type === "percentage"
      ? regularPrice * (promotion.discount_value / 100)
      : promotion.discount_value;

  const final = Math.max(0, regularPrice - discountAmount);
  const discountLabel =
    promotion.discount_type === "percentage"
      ? `${promotion.discount_value}% off`
      : `AED ${promotion.discount_value.toLocaleString()} off`;

  return {
    original: regularPrice,
    discountAmount: regularPrice - final,
    final,
    discountLabel,
  };
}
