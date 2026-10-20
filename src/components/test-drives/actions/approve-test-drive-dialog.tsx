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
import { approveTestDriveAction, getApprovalPreviewAction } from "@/app/admin/test-drives/actions";
import type {
  ApprovalPreview,
  BookingProblem,
  StaffAvailabilityMap,
  TestDriveActionSubject,
} from "@/src/lib/types/test-drive";

interface ApproveTestDriveDialogProps {
  subject: TestDriveActionSubject;
  onClose: () => void;
  /** Called after a successful approval. */
  onDone: () => void;
}

interface StaffMeta {
  staff: { id: string; full_name: string }[];
  availability: StaffAvailabilityMap | null;
}

const SCHEDULE_KINDS: BookingProblem["kind"][] = ["unavailable", "passed", "closed", "hours"];

const problemText = (problem: BookingProblem) => [problem.message, problem.detail].filter(Boolean).join(" ");

// The parent only renders this while it's open, so every opening starts from
// a clean state and a fresh availability check.
export function ApproveTestDriveDialog({ subject, onClose, onDone }: ApproveTestDriveDialogProps) {
  const [staffId, setStaffId] = useState(subject.assigned_staff_id ?? "");
  const [nonce, setNonce] = useState(0);
  const [meta, setMeta] = useState<StaffMeta | null>(null);
  const [previewState, setPreviewState] = useState<{ key: string; data: ApprovalPreview | null } | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Each answer is stored with the key it belongs to, so a stale answer is
  // simply ignored when the staff member changes.
  const key = `${staffId}|${nonce}`;

  useEffect(() => {
    let cancelled = false;

    getApprovalPreviewAction({ id: subject.id, staffId: staffId || null })
      .then((data) => {
        if (cancelled) return;
        setPreviewState({ key, data });
        if (data) setMeta({ staff: data.staff, availability: data.staffAvailability });
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
  const alreadyActedOn = !!preview && preview.status !== "Pending";

  const scheduleProblem = preview?.problems.find((p) => SCHEDULE_KINDS.includes(p.kind));
  const vehicleProblem = preview?.problems.find((p) => p.kind === "vehicle");
  const staffProblem = preview?.problems.find((p) => p.kind === "staff_busy" || p.kind === "staff_away");

  const indicator = (
    problem: BookingProblem | undefined,
    problemState: AvailabilityState,
    okDetail: string,
  ): { state: AvailabilityState; detail: string } => {
    if (loading) return { state: "checking", detail: "" };
    if (failed || !preview) return { state: "unknown", detail: "We couldn't check this. Try again." };
    if (problem) return { state: problemState, detail: problemText(problem) };
    return { state: "available", detail: okDetail };
  };

  const schedule = indicator(scheduleProblem, "unavailable", "Within the showroom's opening hours.");
  const vehicle = indicator(vehicleProblem, "unavailable", "Free at this time.");
  const staffIndicator = staffId
    ? indicator(
        staffProblem,
        staffProblem?.kind === "staff_busy" ? "conflict" : "unavailable",
        "No other appointments or leave at this time.",
      )
    : { state: "unknown" as AvailabilityState, detail: "Choose who will host this test drive." };

  const staffOptions =
    meta?.staff ??
    (subject.assigned_staff_id && subject.staff_name
      ? [{ id: subject.assigned_staff_id, full_name: subject.staff_name }]
      : []);

  const options = staffOptions.map((s) => {
    const entry = meta?.availability?.[s.id];
    const suffix =
      entry?.state === "busy" ? " (busy at this time)" : entry?.state === "away" ? " (on leave)" : "";
    return { value: s.id, label: `${s.full_name}${suffix}` };
  });

  const canApprove = !!preview && !alreadyActedOn && preview.problems.length === 0 && !!staffId && !isSaving;

  const handleApprove = async () => {
    if (!staffId) {
      setError("Choose a staff member to host this test drive.");
      return;
    }

    setError(null);
    setIsSaving(true);
    const result = await approveTestDriveAction({ id: subject.id, staffId });
    setIsSaving(false);

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
      setNonce((n) => n + 1); // look at the schedule again: it may have just changed
      return;
    }

    toast.success("Appointment Approved Successfully");
    onDone();
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Approve test drive"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleApprove} isLoading={isSaving} disabled={!canApprove}>
            Approve
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <TestDriveActionSummary subject={subject} />

        <p className="text-body-sm text-text-muted">
          Approving reserves the vehicle and the host for this time. Availability is checked again when you
          confirm.
        </p>

        <Select
          label="Host"
          placeholder="Choose a staff member"
          options={options}
          value={staffId}
          onChange={(event) => {
            setStaffId(event.target.value);
            setError(null);
          }}
        />

        <div className="border-border flex flex-col gap-3 rounded-md border p-3">
          <AvailabilityIndicator state={schedule.state} label="Appointment time" detail={schedule.detail} />
          <AvailabilityIndicator
            state={vehicle.state}
            label="Vehicle"
            detail={vehicle.detail}
            help="Checks this car's other confirmed bookings, including the buffer after each drive."
          />
          <AvailabilityIndicator
            state={staffIndicator.state}
            label="Host"
            detail={staffIndicator.detail}
            help="Checks the host's other confirmed appointments and any leave."
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

        {alreadyActedOn && (
          <p
            role="alert"
            className="text-body-sm text-text-primary rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2"
          >
            This request is now {preview?.status.toLowerCase()}, so it can&apos;t be approved. Close this and
            refresh the page.
          </p>
        )}

        {failed && (
          <p
            role="alert"
            className="text-body-sm text-text-primary rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2"
          >
            We couldn&apos;t check availability, so approval is paused. Press &ldquo;Check again&rdquo; to try
            again.
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
