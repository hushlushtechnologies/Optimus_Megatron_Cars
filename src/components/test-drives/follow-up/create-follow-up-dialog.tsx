"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Modal } from "@/src/components/ui/modal";
import { Select } from "@/src/components/ui/select";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Textarea } from "@/src/components/ui/textarea";
import { useDiscardGuard } from "@/src/components/test-drives/actions/use-discard-guard";
import {
  createFollowUpFromTestDriveAction,
  getFollowUpFormDataAction,
} from "@/app/admin/test-drives/follow-up-actions";
import { FOLLOW_UP_TYPES } from "@/src/lib/validation/test-drive-follow-up";
import { addDaysToIso } from "@/src/lib/utils/test-drive-slots";
import { formatDateTimeFull, getDubaiToday } from "@/src/lib/utils/test-drive-format";
import { cn } from "@/src/lib/utils/cn";
import type { TestDriveFollowUpFormData } from "@/src/lib/types/test-drive";

interface CreateFollowUpDialogProps {
  testDriveId: string;
  onClose: () => void;
  /** Called after the follow-up was scheduled. */
  onDone: () => void;
}

interface FormState {
  /** "keep" (the drive's own lead), "existing:<lead id>", "create", or "" (nothing chosen yet). */
  leadChoice: string;
  type: string;
  date: string;
  time: string;
  notes: string;
}

function suggestNotes(data: TestDriveFollowUpFormData): string {
  const parts = [`Follow up after test drive ${data.testDriveNumber} (${data.vehicleTitle}).`];
  if (data.interest) parts.push(`Interest: ${data.interest}.`);
  if (data.nextStep) parts.push(`Recommended next step: ${data.nextStep}`);
  return parts.join(" ");
}

function RadioCard({
  checked,
  disabled,
  onSelect,
  title,
  description,
}: {
  checked: boolean;
  disabled?: boolean;
  onSelect: () => void;
  title: string;
  description?: string;
}) {
  return (
    <label className={cn("relative block", disabled ? "cursor-not-allowed" : "cursor-pointer")}>
      <input
        type="radio"
        name="follow-up-lead"
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        className="peer sr-only"
      />
      <span
        className={cn(
          "peer-focus-visible:ring-primary flex flex-col gap-0.5 rounded-lg border px-3 py-2.5 transition-colors peer-focus-visible:ring-2 motion-reduce:transition-none",
          checked ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-card-hover",
          disabled && "hover:bg-card opacity-50",
        )}
      >
        <span className={cn("text-body-sm font-medium", checked ? "text-primary-text" : "text-text-primary")}>
          {title}
        </span>
        {description && <span className="text-caption text-text-muted">{description}</span>}
      </span>
    </label>
  );
}

// The parent only renders this while it's open, so every opening loads fresh data and starts clean.
export function CreateFollowUpDialog({ testDriveId, onClose, onDone }: CreateFollowUpDialogProps) {
  const [data, setData] = useState<TestDriveFollowUpFormData | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [today, setToday] = useState("");
  const [form, setForm] = useState<FormState | null>(null);
  const [initial, setInitial] = useState<FormState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getFollowUpFormDataAction({ id: testDriveId })
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setLoadFailed(true);
          return;
        }

        // The date is worked out here, once, when the data arrives, so it stays steady while the dialog is open.
        const todayIso = getDubaiToday();
        const leadChoice = result.lead
          ? "keep"
          : result.sameVehicleLead
            ? `existing:${result.sameVehicleLead.id}`
            : result.openLeads.length > 0
              ? `existing:${result.openLeads[0].id}`
              : result.canLinkLead && result.canManageLeads
                ? "create"
                : "";

        const start: FormState = {
          leadChoice,
          type: "Phone Call",
          date: addDaysToIso(todayIso, 1),
          time: "10:00",
          notes: suggestNotes(result),
        };

        setToday(todayIso);
        setData(result);
        setForm(start);
        setInitial(start);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [testDriveId]);

  const dirty =
    !!form &&
    !!initial &&
    (form.leadChoice !== initial.leadChoice ||
      form.type !== initial.type ||
      form.date !== initial.date ||
      form.time !== initial.time ||
      form.notes !== initial.notes);

  const guard = useDiscardGuard(dirty, onClose);

  // Why this can't go ahead, if it can't.
  let blocked: string | null = null;
  if (data) {
    if (data.existing) {
      blocked = `A follow-up was already created from this test drive (${data.existing.type}, ${data.existing.status}, ${formatDateTimeFull(data.existing.scheduledAt)}).`;
    } else if (data.archived)
      blocked = "This test drive is archived, so a follow-up can't be created from it.";
    else if (data.status !== "Completed")
      blocked = `Only a completed test drive can have a follow-up. This one is ${data.status.toLowerCase()}.`;
    else if (!data.canManageLeads)
      blocked =
        "Creating a follow-up needs permission to manage leads. Ask an administrator if you need access.";
    else if (data.lead && !data.lead.isOpen) {
      blocked = `Lead ${data.lead.leadNumber} is closed (${data.lead.stageName}), so a follow-up can't be added to it.`;
    } else if (!data.lead && !data.canLinkLead) {
      blocked = "This test drive has no lead, and linking one needs permission to edit test drives.";
    }
  }

  const handleSave = async () => {
    if (!data || !form) return;

    if (!form.leadChoice) {
      setError("Choose which lead the follow-up belongs to.");
      return;
    }
    if (!form.date || !form.time) {
      setError("Choose a date and time for the follow-up.");
      return;
    }

    const lead =
      form.leadChoice === "keep"
        ? { mode: "keep" as const }
        : form.leadChoice === "create"
          ? { mode: "create" as const }
          : { mode: "existing" as const, leadId: form.leadChoice.replace("existing:", "") };

    setError(null);
    setIsSaving(true);

    const result = await createFollowUpFromTestDriveAction({
      id: testDriveId,
      lead,
      type: form.type,
      date: form.date,
      time: form.time,
      notes: form.notes,
    });

    setIsSaving(false);

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
      return;
    }

    toast.success("Follow-up Scheduled Successfully");
    if (result.warning) toast.warning(result.warning);
    onDone();
  };

  const footer = guard.confirming ? (
    <>
      <Button variant="outline" onClick={guard.keepEditing}>
        Keep Editing
      </Button>
      <Button variant="destructive" onClick={guard.discard}>
        Discard Changes
      </Button>
    </>
  ) : (
    <>
      <Button variant="outline" onClick={guard.requestClose} disabled={isSaving}>
        {blocked ? "Close" : "Cancel"}
      </Button>
      {!blocked && (
        <Button
          onClick={handleSave}
          isLoading={isSaving}
          disabled={!data || !form || isSaving}
          leftIcon={<CalendarPlus className="size-4" />}
        >
          Schedule Follow-Up
        </Button>
      )}
    </>
  );

  return (
    <Modal
      isOpen
      onClose={isSaving ? () => undefined : guard.requestClose}
      title="Create follow-up"
      footer={footer}
    >
      <div className="flex flex-col gap-5">
        {guard.confirming && (
          <p
            role="alert"
            className="text-body-sm text-text-primary rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2"
          >
            You have unsaved changes. Discard them, or keep editing?
          </p>
        )}

        {loadFailed ? (
          <p
            role="alert"
            className="text-body-sm text-text-primary rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2"
          >
            We couldn&apos;t load this test drive, or you don&apos;t have permission. Close this and try
            again.
          </p>
        ) : !data || !form ? (
          <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <>
            <div className="border-border bg-card-hover/40 rounded-md border p-3">
              <p className="text-caption text-text-subtle">{data.testDriveNumber}</p>
              <p className="text-text-primary font-medium">{data.customerName}</p>
              <p className="text-body-sm text-text-muted">{data.vehicleTitle}</p>
            </div>

            {blocked ? (
              <p
                role="alert"
                className="text-body-sm text-text-primary rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2"
              >
                {blocked}
              </p>
            ) : (
              <>
                <section aria-labelledby="follow-up-lead" className="flex flex-col gap-2">
                  <h3 id="follow-up-lead" className="text-label">
                    Which lead?
                  </h3>

                  {data.lead ? (
                    <p className="text-body-sm text-text-muted">
                      It goes on lead{" "}
                      <span className="text-text-primary font-medium">{data.lead.leadNumber}</span> (
                      {data.lead.stageName}), which this test drive is already linked to. Whoever owns that
                      lead gets the reminder.
                    </p>
                  ) : (
                    <div role="radiogroup" aria-label="Which lead?" className="flex flex-col gap-2">
                      <p className="text-body-sm text-text-muted">
                        This test drive isn&apos;t linked to a lead yet. Link one, or create a new lead for
                        the customer.
                      </p>

                      {data.openLeadsFailed && (
                        <p role="alert" className="text-body-sm text-red-500">
                          We couldn&apos;t load this customer&apos;s leads. You can still create a new one.
                        </p>
                      )}

                      {data.openLeads.map((lead) => (
                        <RadioCard
                          key={lead.id}
                          checked={form.leadChoice === `existing:${lead.id}`}
                          onSelect={() => setForm({ ...form, leadChoice: `existing:${lead.id}` })}
                          title={`Link ${lead.lead_number} (${lead.stage_name})`}
                          description={
                            lead.id === data.sameVehicleLead?.id
                              ? `${lead.vehicle_title ?? "No vehicle"} · same vehicle as this test drive`
                              : (lead.vehicle_title ?? "No vehicle linked")
                          }
                        />
                      ))}

                      <RadioCard
                        checked={form.leadChoice === "create"}
                        disabled={!!data.sameVehicleLead}
                        onSelect={() => setForm({ ...form, leadChoice: "create" })}
                        title="Create a new lead"
                        description={
                          data.sameVehicleLead
                            ? `${data.sameVehicleLead.leadNumber} is already open for this vehicle, so link that one instead.`
                            : "Starts in the first pipeline stage, unassigned. Give it an owner from the Leads page."
                        }
                      />
                    </div>
                  )}
                </section>

                <section
                  aria-labelledby="follow-up-when"
                  className="border-border flex flex-col gap-3 border-t pt-4"
                >
                  <h3 id="follow-up-when" className="text-label">
                    The follow-up
                  </h3>

                  <Select
                    label="Type"
                    options={FOLLOW_UP_TYPES.map((t) => ({ value: t, label: t }))}
                    value={form.type}
                    onChange={(event) => setForm({ ...form, type: event.target.value })}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Date"
                      type="date"
                      required
                      min={today}
                      value={form.date}
                      onChange={(event) => setForm({ ...form, date: event.target.value })}
                    />
                    <Input
                      label="Time"
                      type="time"
                      required
                      value={form.time}
                      onChange={(event) => setForm({ ...form, time: event.target.value })}
                    />
                  </div>
                  <p className="text-caption text-text-subtle -mt-1">Dubai time.</p>

                  <Textarea
                    label="Notes"
                    rows={4}
                    maxLength={1000}
                    value={form.notes}
                    onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  />
                </section>
              </>
            )}
          </>
        )}

        {error && (
          <p
            role="alert"
            className="text-body-sm text-text-primary rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2"
          >
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
