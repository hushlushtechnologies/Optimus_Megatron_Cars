"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Modal } from "@/src/components/ui/modal";
import { Select } from "@/src/components/ui/select";
import {
  AvailabilityIndicator,
  type AvailabilityState,
} from "@/src/components/test-drives/availability-indicator";
import { TestDriveActionSummary } from "@/src/components/test-drives/actions/test-drive-action-summary";
import {
  assignTestDriveStaffAction,
  getAssignmentPreviewAction,
} from "@/app/admin/test-drives/assignment-actions";
import type {
  AssignmentPreview,
  StaffAvailabilityMap,
  TestDriveActionSubject,
  TestDriveStatus,
} from "@/src/lib/types/test-drive";

interface AssignTestDriveStaffDialogProps {
  subject: TestDriveActionSubject;
  onClose: () => void;
  /** Called after a successful assignment. */
  onDone: () => void;
}

interface StaffMeta {
  staff: { id: string; full_name: string }[];
  availability: StaffAvailabilityMap | null;
  currentStaffId: string | null;
}

const ASSIGNABLE: TestDriveStatus[] = ["Pending", "Approved", "Rescheduled"];

// The parent only renders this while it's open, so every opening starts from
// a clean state and a fresh availability check.
export function AssignTestDriveStaffDialog({ subject, onClose, onDone }: AssignTestDriveStaffDialogProps) {
  const [staffId, setStaffId] = useState("");
  const [nonce, setNonce] = useState(0);
  const [meta, setMeta] = useState<StaffMeta | null>(null);
  const [previewState, setPreviewState] = useState<{ key: string; data: AssignmentPreview | null } | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Each answer is stored with the key it belongs to, so a stale answer is
  // simply ignored when the chosen person changes.
  const key = `${staffId}|${nonce}`;

  useEffect(() => {
    let cancelled = false;

    getAssignmentPreviewAction({ id: subject.id, staffId: staffId || null })
      .then((data) => {
        if (cancelled) return;
        setPreviewState({ key, data });
        if (data)
          setMeta({
            staff: data.staff,
            availability: data.staffAvailability,
            currentStaffId: data.currentStaffId,
          });
      })
      .catch(() => {
        if (!cancelled) setPreviewState({ key, data: null });
      });

    return () => {
      cancelled = true;
    };
  }, [key, subject.id, staffId]);

  const current = previewState && previewState.key === key ? previewState : null;
  const loading = !current;
  const preview = current?.data ?? null;
  const failed = !!current && current.data === null;

  const currentStaffId = meta ? meta.currentStaffId : subject.assigned_staff_id;
  const isReassign = !!currentStaffId;
  const currentStaffName =
    meta?.staff.find((s) => s.id === currentStaffId)?.full_name ?? subject.staff_name ?? null;

  const noLongerAssignable = !!preview && !ASSIGNABLE.includes(preview.status);
  const hostChangedMeanwhile = !!preview && preview.currentStaffId !== subject.assigned_staff_id;

  const options = (meta?.staff ?? [])
    .filter((s) => s.id !== currentStaffId)
    .map((s) => {
      const entry = meta?.availability?.[s.id];
      const suffix =
        entry?.state === "busy" ? " (busy at this time)" : entry?.state === "away" ? " (on leave)" : "";
      return { value: s.id, label: `${s.full_name}${suffix}` };
    });

  const freeCount = meta?.availability
    ? (meta.staff ?? []).filter(
        (s) => s.id !== currentStaffId && meta.availability?.[s.id]?.state === "available",
      ).length
    : null;

  let indicator: { state: AvailabilityState; detail: string };
  const problem = preview?.problems[0];

  if (!staffId) indicator = { state: "unknown", detail: "Choose who will host this test drive." };
  else if (loading) indicator = { state: "checking", detail: "" };
  else if (failed || !preview) {
    indicator = { state: "unknown", detail: "We couldn't check this person's schedule. Press Check again." };
  } else if (problem) {
    indicator = {
      state: problem.kind === "staff_busy" ? "conflict" : "unavailable",
      detail: [problem.message, problem.detail].filter(Boolean).join(" "),
    };
  } else {
    indicator = { state: "available", detail: "No other appointments or leave at this time." };
  }

  const canAssign =
    !!preview && !noLongerAssignable && !!staffId && preview.problems.length === 0 && !isSaving;

  const handleAssign = async () => {
    if (!staffId || !preview) return;

    setError(null);
    setIsSaving(true);
    const result = await assignTestDriveStaffAction({
      id: subject.id,
      staffId,
      expectedStaffId: preview.currentStaffId,
    });
    setIsSaving(false);

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
      setNonce((n) => n + 1); // look at the schedule again: it may have just changed
      return;
    }

    toast.success(isReassign ? "Staff Reassigned Successfully" : "Staff Assigned Successfully");
    onDone();
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isReassign ? "Reassign staff" : "Assign staff"}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleAssign} isLoading={isSaving} disabled={!canAssign}>
            {isReassign ? "Reassign" : "Assign"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <TestDriveActionSummary subject={subject} />

        <p className="text-body-sm text-text-muted">
          {isReassign
            ? `${currentStaffName ?? "The current host"} currently hosts this test drive. The new host is checked against their other appointments and leave at this exact time, and both of them are notified.`
            : "Choose who will host this test drive. They're checked against their other appointments and leave at this exact time, and they're notified."}
        </p>

        <Select
          label={isReassign ? "New host" : "Host"}
          placeholder="Choose a staff member"
          options={options}
          value={staffId}
          onChange={(event) => {
            setStaffId(event.target.value);
            setError(null);
          }}
        />

        {freeCount !== null && (
          <p role="status" className="text-caption text-text-subtle -mt-2">
            {freeCount} {freeCount === 1 ? "other staff member is" : "other staff members are"} free at this
            time.
          </p>
        )}

        <div className="border-border flex flex-col gap-3 rounded-md border p-3">
          <AvailabilityIndicator
            state={indicator.state}
            label="Host"
            detail={indicator.detail}
            help="Checks the host's other confirmed appointments and any leave, including the buffer after each drive."
          />

          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              leftIcon={<RefreshCw className="size-3.5" />}
              onClick={() => setNonce((n) => n + 1)}
              disabled={loading || isSaving}
            >
              Check again
            </Button>
          </div>
        </div>

        {hostChangedMeanwhile && !noLongerAssignable && (
          <p
            role="status"
            className="text-body-sm text-text-primary rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2"
          >
            The host was changed by someone else since this page loaded. What you see here is the current
            situation.
          </p>
        )}

        {noLongerAssignable && (
          <p
            role="alert"
            className="text-body-sm text-text-primary rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2"
          >
            This test drive is now {preview?.status.toLowerCase()}, so its host can&apos;t be changed. Close
            this and refresh the page.
          </p>
        )}

        {failed && (
          <p
            role="alert"
            className="text-body-sm text-text-primary rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2"
          >
            We couldn&apos;t load the staff list, so assigning is paused. Press &ldquo;Check again&rdquo; to
            try again.
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
      </div>
    </Modal>
  );
}
