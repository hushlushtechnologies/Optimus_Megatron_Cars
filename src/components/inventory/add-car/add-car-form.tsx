"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormProvider, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AddCarShell } from "@/src/components/inventory/add-car/add-car-shell";
import { BasicInformationSection } from "@/src/components/inventory/add-car/sections/basic-information-section";
import { SpecificationsSection } from "@/src/components/inventory/add-car/sections/specifications-section";
import { ExteriorInteriorSection } from "@/src/components/inventory/add-car/sections/exterior-interior-section";
import { PricingPromotionSection } from "@/src/components/inventory/add-car/sections/pricing-promotion-section";
import { WarrantyInspectionSection } from "@/src/components/inventory/add-car/sections/warranty-inspection-section";
import { MediaSection } from "@/src/components/inventory/add-car/sections/media-section";
import { PublishingSection } from "@/src/components/inventory/add-car/sections/publishing-section";
import { SuccessDialog } from "@/src/components/shared/success-dialog";
import { useUnsavedChangesWarning } from "@/src/hooks/use-unsaved-changes-warning";
import { addCarDraftSchema, addCarDraftDefaults, type AddCarDraftValues } from "@/src/lib/validation/car";
import { saveCarRecord } from "@/app/admin/inventory/new/actions";
import type { AddCarLookups } from "@/src/lib/supabase/inventory-lookups";
import type { CarMedia } from "@/src/lib/types/inventory";

interface AddCarFormProps {
  mode?: "create" | "edit";
  carId: string | null;
  isPublished?: boolean;
  initialValues: Partial<AddCarDraftValues> | null;
  initialLookups: AddCarLookups;
  initialMedia: CarMedia[];
}

export function AddCarForm({
  mode = "create",
  carId: initialCarId,
  isPublished = false,
  initialValues,
  initialLookups,
  initialMedia,
}: AddCarFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [carId, setCarId] = useState(initialCarId);
  const [lookups, setLookups] = useState(initialLookups);
  const [media, setMedia] = useState(initialMedia);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingChanges, setIsSavingChanges] = useState(false);
  const [isDraftSaved, setIsDraftSaved] = useState(!!initialCarId);
  const [publishSuccessOpen, setPublishSuccessOpen] = useState(false);

  const methods = useForm<AddCarDraftValues>({
    // Cast is needed because z.coerce.number() fields give the schema's
    // "input" type (pre-coercion) and "output" type (post-coercion, what
    // AddCarDraftValues represents) different shapes — zodResolver's
    // inferred generic is built from the input shape, which TypeScript
    // then can't prove matches useForm<AddCarDraftValues>'s output shape.
    // This assertion only affects what TS believes the type is; Zod still
    // coerces correctly at runtime regardless.
    resolver: zodResolver(addCarDraftSchema) as Resolver<AddCarDraftValues>,
    defaultValues: { ...addCarDraftDefaults, ...initialValues },
  });

  useUnsavedChangesWarning(methods.formState.isDirty);

  const syncCarId = (newCarId: string) => {
    setCarId(newCarId);
    const params = new URLSearchParams(searchParams.toString());
    params.set("carId", newCarId);
    router.replace(`/admin/inventory/new?${params.toString()}`, {
      scroll: false,
    });
  };

  const handleSaveDraft = methods.handleSubmit(
    async (values) => {
      setIsSavingDraft(true);
      const result = await saveCarRecord(carId, values);
      setIsSavingDraft(false);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setIsDraftSaved(true);
      methods.reset(values);

      if (mode === "create" && !carId && result.carId) {
        syncCarId(result.carId);
        toast.success("Vehicle saved as draft");
      } else {
        toast.success("Draft updated");
      }
    },
    () => toast.error("Please fix the highlighted fields before saving."),
  );

  const handlePublish = methods.handleSubmit(
    async (values) => {
      setIsPublishing(true);
      const result = await saveCarRecord(carId, values, {
        publish: true,
        hasImages: media.some((m) => m.media_type === "image"),
      });
      setIsPublishing(false);

      if (result.blockers.length > 0) {
        toast.error(`${result.error} ${result.blockers.join(", ")}.`);
        return;
      }
      if (result.error) {
        toast.error(result.error);
        return;
      }

      setIsDraftSaved(true);
      methods.reset(values);
      if (mode === "create" && !carId && result.carId) syncCarId(result.carId);
      setPublishSuccessOpen(true);
    },
    () => toast.error("Please fix the highlighted fields before publishing."),
  );

  const handleSaveChanges = methods.handleSubmit(
    async (values) => {
      setIsSavingChanges(true);
      const result = await saveCarRecord(carId, values);
      setIsSavingChanges(false);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      methods.reset(values);
      toast.success("Vehicle Updated Successfully");
    },
    () => toast.error("Please fix the highlighted fields before saving."),
  );

  return (
    <FormProvider {...methods}>
      <form onSubmit={(e) => e.preventDefault()}>
        <AddCarShell
          mode={mode}
          isPublished={isPublished}
          onSaveDraft={handleSaveDraft}
          onPublish={handlePublish}
          onSaveChanges={handleSaveChanges}
          isSavingDraft={isSavingDraft}
          isPublishing={isPublishing}
          isSavingChanges={isSavingChanges}
          isDraftSaved={isDraftSaved}
          canPublish={!!carId}
        >
          <BasicInformationSection lookups={lookups} onLookupsChange={(updater) => setLookups(updater)} />
          <SpecificationsSection lookups={lookups} />
          <ExteriorInteriorSection lookups={lookups} />
          <PricingPromotionSection promotions={lookups.promotions} />
          <WarrantyInspectionSection warrantyTypes={lookups.warrantyTypes} />
          <MediaSection carId={carId} initialMedia={media} />
          <PublishingSection />
        </AddCarShell>
      </form>

      <SuccessDialog
        isOpen={publishSuccessOpen}
        onClose={() => router.push("/admin/inventory")}
        title="Vehicle Published Successfully"
        description="This listing is now live and visible according to its publishing settings."
        actionLabel="Go to Inventory"
      />
    </FormProvider>
  );
}
