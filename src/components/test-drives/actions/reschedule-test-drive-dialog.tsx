"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Modal } from "@/src/components/ui/modal";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Textarea } from "@/src/components/ui/textarea";
import { TestDriveActionSummary } from "@/src/components/test-drives/actions/test-drive-action-summary";
import {
  ScheduleEditor,
  draftFromEditData,
  scheduleFieldsChanged,
  type ScheduleDraft,
} from "@/src/components/test-drives/actions/schedule-editor";
import { useDiscardGuard } from "@/src/components/test-drives/actions/use-discard-guard";
import { getTestDriveEditDataAction, rescheduleTestDriveAction } from "@/app/admin/test-drives/edit-actions";
import { formatDayLong, formatTimeRange } from "@/src/lib/utils/test-drive-format";
import type { TestDriveActionSubject, TestDriveEditData } from "@/src/lib/types/test-drive";

const QUICK_REASONS = [
  "Customer asked to move it",
  "Vehicle isn't available",
  "Host isn't available",
  "Showroom closed that day",
];

const RESCHEDULABLE = ["Approved", "Rescheduled"];

interface RescheduleTestDriveDialogProps {
  subject: TestDriveActionSubject;
  onClose: () => void;
  /** Called after a successful reschedule. */
  onDone: () => void;
}

interface FormState {
  draft: ScheduleDraft;
  reason: string;
}

// The parent only renders this while it's open, so every opening loads fresh data and starts clean.
export function RescheduleTestDriveDialog({ subject, onClose, onDone }: RescheduleTestDriveDialogProps) {
  const [data, setData] = useState<TestDriveEditData | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [conflictAt, setConflictAt] = useState<{ date: string; time: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setForm({ draft: draftFromEditData(result), reason: "" });
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [subject.id]);

  const original = data ? draftFromEditData(data) : null;
  const blockedReason = !data
    ? null
    : !RESCHEDULABLE.includes(data.status)
      ? `This test drive is now ${data.status.toLowerCase()}, so it can't be rescheduled. Close this and refresh the page.`
      : data.isCheckedIn
        ? "This customer has already checked in, so the appointment can't be rescheduled."
        : !data.can.reschedule
          ? "You don't have permission to reschedule test drives."
          : null;

  const moved = !!form && !!original && scheduleFieldsChanged(form.draft, original);
  const reasonOk = !!form && form.reason.trim().length >= 3;
  const hasHost = !!form?.draft.staffId;

  const dirty =
    !!form &&
    !!original &&
    (moved || form.draft.staffId !== original.staffId || form.reason.trim().length > 0);
  const guard = useDiscardGuard(dirty, onClose);

  const missing: string[] = [];
  if (form) {
    if (!moved) missing.push("choose a new date, time, duration or showroom");
    else if (!form.draft.time) missing.push("pick an available time");
    if (!hasHost) missing.push("choose a host");
    if (!reasonOk) missing.push("give a reason");
  }
  const canSave = !!data && !!form && !blockedReason && missing.length === 0 && !isSaving;

  const handleDraftChange = (patch: Partial<ScheduleDraft>) => {
    setConflictAt(null);
    setForm((prev) => (prev ? { ...prev, draft: { ...prev.draft, ...patch } } : prev));
  };

  const handleSave = async () => {
    if (!data || !form || !form.draft.staffId) return;

    setError(null);
    setIsSaving(true);

    const result = await rescheduleTestDriveAction({
      id: data.id,
      expectedUpdatedAt: data.updatedAt,
      locationId: form.draft.locationId,
      date: form.draft.date,
      time: form.draft.time,
      durationMinutes: form.draft.durationMinutes,
      staffId: form.draft.staffId,
      reason: form.reason.trim(),
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

    toast.success("Test Drive Rescheduled Successfully");
    onDone();
  };

  const currentEnd = data
    ? new Date(Date.parse(data.scheduledStart) + data.durationMinutes * 60_000).toISOString()
    : "";
  const currentShowroom =
    data?.showrooms.find((s) => s.id === data.locationId)?.name ?? subject.location_name;

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
      <Button onClick={handleSave} isLoading={isSaving} disabled={!canSave}>
        Reschedule
      </Button>
    </>
  );

  return (
    <Modal
      isOpen
      onClose={isSaving ? () => undefined : guard.requestClose}
      title="Reschedule test drive"
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
            We couldn&apos;t load this test drive, or you don&apos;t have permission. Close this and try
            again.
          </p>
        ) : !data || !form ? (
          <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <>
            {blockedReason && (
              <p
                role="alert"
                className="text-body-sm text-text-primary rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2"
              >
                {blockedReason}
              </p>
            )}

            <div className="border-border bg-card-hover/40 rounded-md border px-3 py-2">
              <p className="text-caption text-text-subtle">Currently booked for</p>
              <p className="text-body-sm text-text-primary">
                {formatDayLong(data.scheduledStart)} · {formatTimeRange(data.scheduledStart, currentEnd)} ·{" "}
                {currentShowroom}
              </p>
            </div>

            <ScheduleEditor
              testDriveId={data.id}
              showrooms={data.showrooms}
              hosts={data.hosts}
              draft={form.draft}
              onDraftChange={handleDraftChange}
              canChangeHost={data.can.assign}
              lockedHostName={subject.staff_name}
              hostRequired
              suggestOnUnavailable
              conflictAt={conflictAt}
              refreshKey={refreshKey}
            />

            <div className="border-border flex flex-col gap-3 border-t pt-4">
              <div className="flex flex-col gap-2">
                <p className="text-caption text-text-subtle">Quick reasons</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_REASONS.map((reason) => (
                    <Button
                      key={reason}
                      type="button"
                      size="sm"
                      variant={form.reason === reason ? "outline" : "secondary"}
                      aria-pressed={form.reason === reason}
                      onClick={() => setForm({ ...form, reason })}
                    >
                      {reason}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Textarea
                  label="Reason for rescheduling"
                  placeholder="Why is this appointment moving?"
                  rows={3}
                  maxLength={500}
                  value={form.reason}
                  onChange={(event) => setForm({ ...form, reason: event.target.value })}
                />
                <p className="text-caption text-text-subtle text-right">{form.reason.length}/500</p>
              </div>

              <p className="text-caption text-text-subtle">
                The original time is kept in the appointment history, and the host is notified.
              </p>
            </div>

            {missing.length > 0 && !blockedReason && (
              <p role="status" className="text-caption text-text-subtle">
                To reschedule, {missing.join(", ")}.
              </p>
            )}

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
