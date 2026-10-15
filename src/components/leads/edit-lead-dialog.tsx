"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Modal } from "@/src/components/ui/modal";
import { Select } from "@/src/components/ui/select";
import { Input } from "@/src/components/ui/input";
import { Combobox, type ComboboxOption } from "@/src/components/ui/combobox";
import { Button } from "@/src/components/ui/button";
import { getLeadEditValues, updateLead, type LeadEditValues } from "@/app/admin/leads/[id]/edit-actions";
import { searchCarsForLead } from "@/app/admin/leads/new/actions";
import type { LeadSourceOption } from "@/src/lib/supabase/lead-lookups";

interface EditLeadDialogProps {
  onClose: () => void;
  leadId: string;
  isClosed: boolean;
  sources: LeadSourceOption[];
}

// The parent only renders this while it's open, so every opening starts from
// a clean state and a fresh load. There's no reset-on-open effect to maintain.
export function EditLeadDialog({ onClose, leadId, isClosed, sources }: EditLeadDialogProps) {
  const router = useRouter();
  const [original, setOriginal] = useState<LeadEditValues | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [carOptions, setCarOptions] = useState<ComboboxOption[]>([]);
  const [carId, setCarId] = useState<string | null>(null);
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [sourceDetail, setSourceDetail] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getLeadEditValues(leadId), searchCarsForLead()]).then(([values, cars]) => {
      if (cancelled) return;
      if (!values) {
        setLoadFailed(true);
        return;
      }

      const options: ComboboxOption[] = cars.map((c) => ({
        id: c.id,
        label: `${c.display_title} · ${c.stock_id}`,
      }));
      // The lead's current vehicle may not be among the 200 most recent cars,
      // so make sure it's always selectable.
      if (values.carId && values.vehicleLabel && !options.some((o) => o.id === values.carId)) {
        options.unshift({ id: values.carId, label: values.vehicleLabel });
      }

      setCarOptions(options);
      setOriginal(values);
      setCarId(values.carId);
      setSourceId(values.sourceId);
      setSourceDetail(values.sourceDetail);
    });

    return () => {
      cancelled = true;
    };
  }, [leadId]);

  const requiresDetail = sources.find((s) => s.id === sourceId)?.requires_detail ?? false;
  const vehicleWillBeRemoved = !!original?.carId && !carId && !isClosed;

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateLead(leadId, { carId, sourceId, sourceDetail });
    setIsSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast[result.changed ? "success" : "info"](result.changed ? "Lead updated" : "No changes to save");
    // Re-fetches the page's server data, which the detail page picks up.
    router.refresh();
    onClose();
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Edit Lead"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={isSaving} disabled={!original}>
            Save Changes
          </Button>
        </>
      }
    >
      {loadFailed ? (
        <p className="text-body-sm text-text-muted">
          We couldn&apos;t load this lead. Close this and try again.
        </p>
      ) : !original ? (
        <p className="text-body-sm text-text-muted" aria-live="polite">
          Loading…
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Combobox
              label="Vehicle of Interest"
              placeholder="Search by name or stock ID..."
              value={carId}
              onChange={setCarId}
              options={carOptions}
              disabled={isClosed}
              disabledHint={original.vehicleLabel ?? "No vehicle linked"}
            />
            {isClosed ? (
              <p className="text-caption text-text-subtle">
                The vehicle can&apos;t be changed on a closed lead. Reopen it first.
              </p>
            ) : vehicleWillBeRemoved ? (
              <p className="text-caption text-amber-400" role="status">
                The vehicle will be removed from this lead when you save.
              </p>
            ) : (
              <p className="text-caption text-text-subtle">Clear the field to unlink the vehicle.</p>
            )}
          </div>

          <Select
            label="Source"
            placeholder="No source"
            options={sources.map((s) => ({ value: s.id, label: s.name }))}
            value={sourceId ?? ""}
            onChange={(e) => setSourceId(e.target.value || null)}
          />

          {requiresDetail && (
            <Input
              label="Specify Source"
              value={sourceDetail}
              onChange={(e) => setSourceDetail(e.target.value)}
            />
          )}
        </div>
      )}
    </Modal>
  );
}
