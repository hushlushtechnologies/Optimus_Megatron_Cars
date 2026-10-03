"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Select } from "@/src/components/ui/select";
import { Switch } from "@/src/components/ui/switch";
import { Button } from "@/src/components/ui/button";
import { useUnsavedChangesWarning } from "@/src/hooks/use-unsaved-changes-warning";
import {
  addCustomerSchema,
  addCustomerDefaults,
  type AddCustomerValues,
} from "@/src/lib/validation/customer";
import { createCustomer } from "@/app/admin/customers/new/actions";
import type { CustomerFilterLookups } from "@/src/lib/supabase/customer-lookups";

const LIFECYCLE_OPTIONS = ["Prospect", "Active", "VIP", "Inactive", "Do Not Contact"].map((v) => ({
  value: v,
  label: v,
}));
const LANGUAGE_OPTIONS = ["English", "Arabic", "Other"].map((v) => ({
  value: v,
  label: v,
}));

interface AddCustomerFormProps {
  lookups: CustomerFilterLookups;
  sourcesWithDetail: Record<string, boolean>;
}

export function AddCustomerForm({ lookups, sourcesWithDetail }: AddCustomerFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<AddCustomerValues>({
    resolver: zodResolver(addCustomerSchema),
    defaultValues: addCustomerDefaults,
  });

  useUnsavedChangesWarning(isDirty);

  const sourceId = watch("source_id");
  const showSourceDetail = sourcesWithDetail[sourceId] ?? false;

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  };

  const onSubmit = handleSubmit(
    async (values) => {
      setIsSaving(true);
      const result = await createCustomer(values, selectedTagIds);
      setIsSaving(false);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(
        values.create_login
          ? "Customer created successfully — a setup email has been sent."
          : "Customer created successfully",
      );
      router.push(`/admin/customers/${result.customerId}`);
    },
    () => toast.error("Please fix the highlighted fields before saving."),
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Card padding="lg" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="First Name" error={errors.first_name?.message} {...register("first_name")} />
        <Input label="Last Name" error={errors.last_name?.message} {...register("last_name")} />
        <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
        <Input
          label="UAE Mobile Number"
          placeholder="05XXXXXXXX"
          error={errors.phone?.message}
          {...register("phone")}
        />
        <Input label="Alternative Phone" placeholder="Optional" {...register("alternative_phone")} />

        <Controller
          control={control}
          name="location_id"
          render={({ field }) => (
            <Select
              label="Location"
              placeholder="Select a location"
              options={lookups.locations.map((l) => ({
                value: l.id,
                label: l.name,
              }))}
              {...field}
              value={field.value ?? ""}
            />
          )}
        />

        <div className="sm:col-span-2">
          <Input label="Address" {...register("address")} />
        </div>

        <Controller
          control={control}
          name="preferred_language"
          render={({ field }) => <Select label="Preferred Language" options={LANGUAGE_OPTIONS} {...field} />}
        />

        <Controller
          control={control}
          name="lifecycle_status"
          render={({ field }) => <Select label="Customer Status" options={LIFECYCLE_OPTIONS} {...field} />}
        />

        <Controller
          control={control}
          name="source_id"
          render={({ field }) => (
            <Select
              label="Customer Source"
              placeholder="Select a source"
              options={lookups.sources.map((s) => ({
                value: s.id,
                label: s.name,
              }))}
              error={errors.source_id?.message}
              {...field}
            />
          )}
        />

        {showSourceDetail && (
          <Input label="Specify Source" placeholder="e.g. Referred by Ahmed" {...register("source_detail")} />
        )}

        <Controller
          control={control}
          name="primary_relationship_manager_id"
          render={({ field }) => (
            <Select
              label="Primary Relationship Manager"
              placeholder="Unassigned"
              options={lookups.staff.map((s) => ({
                value: s.id,
                label: s.full_name,
              }))}
              {...field}
              value={field.value ?? ""}
            />
          )}
        />

        <div className="sm:col-span-2">
          <p className="text-label mb-2">Tags</p>
          <div className="flex flex-wrap gap-2">
            {lookups.tags.map((tag) => {
              const isSelected = selectedTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className="text-body-sm inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-colors"
                  style={{
                    backgroundColor: isSelected ? `${tag.color_hex}1A` : "transparent",
                    borderColor: isSelected ? `${tag.color_hex}66` : "var(--omc-border)",
                    color: isSelected ? tag.color_hex : "var(--omc-text-muted)",
                  }}
                >
                  {isSelected && <Check className="size-3" aria-hidden="true" />}
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="sm:col-span-2">
          <Textarea
            label="Internal Notes"
            placeholder="Anything worth noting about this customer..."
            {...register("internal_notes")}
          />
        </div>
      </Card>

      <Card padding="lg" className="flex flex-col gap-4">
        <p className="text-label">Login Account</p>
        <Controller
          control={control}
          name="create_login"
          render={({ field }) => (
            <Switch
              label="Create Customer Login Account"
              description="Sends a secure setup email — the customer sets their own password. No password is ever visible to admin staff."
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/admin/customers")}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSaving}>
          Create Customer
        </Button>
      </div>
    </form>
  );
}
