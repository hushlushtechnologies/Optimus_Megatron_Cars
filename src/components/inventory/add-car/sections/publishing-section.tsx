"use client";

import { useFormContext, Controller } from "react-hook-form";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Switch } from "@/src/components/ui/switch";
import type { AddCarDraftValues } from "@/src/lib/validation/car";

export function PublishingSection() {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext<AddCarDraftValues>();

  const seoTitleLength = (watch("seo_title") ?? "").length;
  const seoDescLength = (watch("seo_description") ?? "").length;

  return (
    <Card id="publishing" padding="lg" className="scroll-mt-24">
      <h2 className="text-h3">Website &amp; Publishing</h2>
      <p className="text-body-sm text-text-muted mt-1 mb-6">
        Controls how this vehicle appears on the customer website once published.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Slug"
          placeholder="e.g. porsche-911-gt3-touring-2024"
          error={errors.slug?.message}
          {...register("slug")}
        />
        <Input
          label="Publish Date"
          type="date"
          placeholder="Leave blank to publish immediately"
          {...register("publish_date")}
        />
      </div>

      <div className="border-border mt-6 grid grid-cols-1 gap-4 border-t pt-6 sm:grid-cols-2">
        <Controller
          control={control}
          name="featured"
          render={({ field }) => (
            <Switch label="Featured" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
        <Controller
          control={control}
          name="new_arrival"
          render={({ field }) => (
            <Switch label="New Arrival" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
        <Controller
          control={control}
          name="coming_soon"
          render={({ field }) => (
            <Switch label="Coming Soon" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
        <Controller
          control={control}
          name="show_on_homepage"
          render={({ field }) => (
            <Switch label="Show on Homepage" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </div>

      <div className="border-border mt-6 flex flex-col gap-4 border-t pt-6">
        <p className="text-label">SEO</p>
        <div>
          <Input
            label="SEO Title"
            placeholder="Defaults to the vehicle name if left blank"
            error={errors.seo_title?.message}
            {...register("seo_title")}
          />
          <p className="text-caption text-text-subtle mt-1">{seoTitleLength} / 70 characters</p>
        </div>
        <div>
          <Textarea
            label="SEO Description"
            placeholder="A short summary for search engines"
            error={errors.seo_description?.message}
            {...register("seo_description")}
          />
          <p className="text-caption text-text-subtle mt-1">{seoDescLength} / 160 characters</p>
        </div>
      </div>
    </Card>
  );
}
