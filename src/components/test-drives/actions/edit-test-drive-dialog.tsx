"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Modal } from "@/src/components/ui/modal";
import { Select } from "@/src/components/ui/select";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Textarea } from "@/src/components/ui/textarea";
import { TestDriveActionSummary } from "@/src/components/test-drives/actions/test-drive-action-summary";
import {
  ScheduleEditor,
  draftFromEditData,
  scheduleDraftChanged,
  scheduleFieldsChanged,
  type ScheduleDraft,
} from "@/src/components/test-drives/actions/schedule-editor";
import { useDiscardGuard } from "@/src/components/test-drives/actions/use-discard-guard";
import { getTestDriveEditDataAction, updateTestDriveAction } from "@/app/admin/test-drives/edit-actions";
import type { TestDriveActionSubject, TestDriveEditData } from "@/src/lib/types/test-drive";

interface EditTestDriveDialogProps {
  subject: TestDriveActionSubject;
  onClose: () => void;
  /** Called after a successful save. */
  onDone: () => void;
}

interface FormState {
  customerNotes: string;
  internalNotes: string;
  requestSourceId: string;
  draft: ScheduleDraft;
}

const EDITABLE = ["Pending", "Approved", "Rescheduled"];

// The parent only renders this while it's open, so every opening loads fresh data and starts clean.
export function EditTestDriveDialog({ subject, onClose, onDone }: EditTestDriveDialogProps) {
  const [data, setData] = useState<TestDriveEditData | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [conflictAt, setConflictAt] = useState<{ date: string; time: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;

    getTestDriveEditDataAction({ id: subject.id })
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setLoadFailed(true);
          return;
        }
        setData(result);
        setForm({
          customerNotes: result.customerNotes ?? "",
          internalNotes: result.internalNotes ?? "",
          requestSourceId: result.requestSourceId ?? "",
          draft: draftFromEditData(result),
        });
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [subject.id]);

  const original = data ? draftFromEditData(data) : null;
  const isPending = data?.status === "Pending";
  const statusBlocked = !!data && !EDITABLE.includes(data.status);

  const scheduleMoved = !!form && !!original && scheduleFieldsChanged(form.draft, original);
  const hostChanged = !!form && !!original && form.draft.staffId !== original.staffId;

  const dirty =
    !!data &&
    !!form &&
    (form.customerNotes !== (data.customerNotes ?? "") ||
      form.internalNotes !== (data.internalNotes ?? "") ||
      form.requestSourceId !== (data.requestSourceId ?? "") ||
      (isPending && !!original && scheduleDraftChanged(form.draft, original)));

  const guard = useDiscardGuard(dirty, onClose);

  const handleDraftChange = (patch: Partial<ScheduleDraft>) => {
    setConflictAt(null);
    setTimeError(undefined);
    setForm((prev) => (prev ? { ...prev, draft: { ...prev.draft, ...patch } } : prev));
  };

  const handleSave = async () => {
    if (!data || !form || !original) return;

    if (isPending && scheduleMoved && (!form.draft.date || !form.draft.time)) {
      setTimeError("Please select an available time slot.");
      return;
    }

    setError(null);
    setTimeError(undefined);
    setIsSaving(true);

    const result = await updateTestDriveAction({
      id: data.id,
      expectedUpdatedAt: data.updatedAt,
      customerNotes: form.customerNotes,
      internalNotes: form.internalNotes,
      requestSourceId: form.requestSourceId || null,
      schedule:
        isPending && scheduleMoved
          ? {
              locationId: form.draft.locationId,
              date: form.draft.date,
              time: form.draft.time,
              durationMinutes: form.draft.durationMinutes,
            }
          : null,
      ...(isPending && hostChanged ? { staffId: form.draft.staffId } : {}),
    });

    setIsSaving(false);

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
      if (result.refreshAvailability) {
        // The time was taken since the list loaded: clear it, offer the nearest openings, look again.
        setConflictAt({ date: form.draft.date, time: form.draft.time });
        setForm((prev) => (prev ? { ...prev, draft: { ...prev.draft, time: "" } } : prev));
        setRefreshKey((n) => n + 1);
      }
      return;
    }

    if (result.unchanged) {
      toast.info("No changes to save");
      onClose();
      return;
    }

    toast.success("Test Drive Updated Successfully");
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
        Cancel
      </Button>
      <Button onClick={handleSave} isLoading={isSaving} disabled={!data || !form || statusBlocked || !dirty}>
        Save Changes
      </Button>
    </>
  );

  return (
    <Modal
      isOpen
      onClose={isSaving ? () => undefined : guard.requestClose}
      title="Edit test drive"
      footer={footer}
    >
      <div className="flex flex-col gap-5">
        <TestDriveActionSummary subject={subject} />

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
            We couldn&apos;t load this test drive for editing, or you don&apos;t have permission. Close this
            and try again.
          </p>
        ) : !data || !form ? (
          <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <>
            {statusBlocked && (
              <p
                role="alert"
                className="text-body-sm text-text-primary rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2"
              >
                This test drive is now {data.status.toLowerCase()}, so it can&apos;t be edited. Close this and
                refresh the page.
              </p>
            )}

            <div className="flex flex-col gap-4">
              <Textarea
                label="Customer request notes"
                placeholder="Anything the customer asked for."
                rows={3}
                maxLength={1000}
                value={form.customerNotes}
                onChange={(event) => setForm({ ...form, customerNotes: event.target.value })}
              />
              <Textarea
                label="Internal notes"
                placeholder="Only staff see these. The customer never does."
                rows={3}
                maxLength={1000}
                value={form.internalNotes}
                onChange={(event) => setForm({ ...form, internalNotes: event.target.value })}
              />
              <Select
                label="How was this requested?"
                placeholder="Not set"
                options={data.requestSources.map((s) => ({ value: s.id, label: s.name }))}
                value={form.requestSourceId}
                onChange={(event) => setForm({ ...form, requestSourceId: event.target.value })}
              />
            </div>

            <div className="border-border flex flex-col gap-3 border-t pt-4">
              <p className="text-label">Schedule and host</p>

              {isPending ? (
                <>
                  <p className="text-body-sm text-text-muted">
                    This request is still pending, so you can change when it happens. Availability is checked,
                    and anything you change is recorded in the appointment history.
                  </p>
                  <ScheduleEditor
                    testDriveId={data.id}
                    showrooms={data.showrooms}
                    hosts={data.hosts}
                    draft={form.draft}
                    onDraftChange={handleDraftChange}
                    canChangeHost={data.can.assign}
                    lockedHostName={subject.staff_name}
                    hostRequired={false}
                    suggestOnUnavailable={scheduleMoved}
                    conflictAt={conflictAt}
                    refreshKey={refreshKey}
                    errors={{ time: timeError }}
                  />
                </>
              ) : (
                <p className="border-border bg-card-hover/40 text-body-sm text-text-muted rounded-md border px-3 py-2">
                  This appointment is confirmed. To change its date, time or showroom, use{" "}
                  <strong>Reschedule</strong>. To change the host, use <strong>Reassign Staff</strong>.
                </p>
              )}
            </div>

            {error && (
              <p
                role="alert"
                className="text-body-sm text-text-primary rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2"
              >
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
