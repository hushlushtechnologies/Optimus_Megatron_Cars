"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Modal } from "@/src/components/ui/modal";
import { Skeleton } from "@/src/components/ui/skeleton";
import { TestDriveActionSummary } from "@/src/components/test-drives/actions/test-drive-action-summary";
import { TestDriveFeedbackForm } from "@/src/components/test-drives/test-drive-feedback-form";
import { useDiscardGuard } from "@/src/components/test-drives/actions/use-discard-guard";
import { completeTestDriveAction, getCompletionDataAction } from "@/app/admin/test-drives/complete-actions";
import { formatDayLong, formatTime } from "@/src/lib/utils/test-drive-format";
import type { TestDriveFeedbackValues } from "@/src/lib/validation/test-drive-feedback";
import type { TestDriveActionSubject, TestDriveCompletionData } from "@/src/lib/types/test-drive";

const FORM_ID = "complete-test-drive-feedback";
const COMPLETABLE = ["Approved", "Rescheduled"];

interface CompleteTestDriveDialogProps {
  subject: TestDriveActionSubject;
  onClose: () => void;
  /** Called after a successful completion. */
  onDone: () => void;
}

interface Times {
  start: string;
  end: string;
}

/**
 * The check-in moment is the best guess for when the drive began. Without a
 * check-in it's the booked start. The end is the booked length later, but
 * never later than now. A drive that hasn't started leaves both blank.
 */
function proposeTimes(data: TestDriveCompletionData): { times: Times; notStarted: boolean } {
  const nowMs = Date.now();
  const startMs = data.checkedInAt ? Date.parse(data.checkedInAt) : Date.parse(data.scheduledStart);

  if (startMs > nowMs) return { times: { start: "", end: "" }, notStarted: true };

  const endMs = Math.min(startMs + data.durationMinutes * 60_000, nowMs);

  return {
    times: {
      start: formatTime(new Date(startMs)),
      end: endMs > startMs ? formatTime(new Date(endMs)) : "",
    },
    notStarted: false,
  };
}

// The parent only renders this while it's open, so every opening loads fresh data and starts clean.
export function CompleteTestDriveDialog({ subject, onClose, onDone }: CompleteTestDriveDialogProps) {
  const [data, setData] = useState<TestDriveCompletionData | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [initialTimes, setInitialTimes] = useState<Times>({ start: "", end: "" });
  const [times, setTimes] = useState<Times>({ start: "", end: "" });
  const [notStarted, setNotStarted] = useState(false);
  const [feedbackDirty, setFeedbackDirty] = useState(false);
  const [timeError, setTimeError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getCompletionDataAction({ id: subject.id })
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setLoadFailed(true);
          return;
        }

        // The clock is read here, once, when the data arrives, so what's proposed stays steady while the dialog is open.
        const proposal = proposeTimes(result);
        setData(result);
        setInitialTimes(proposal.times);
        setTimes(proposal.times);
        setNotStarted(proposal.notStarted);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [subject.id]);

  const blocked = !!data && !COMPLETABLE.includes(data.status);
  const dirty =
    !!data && (times.start !== initialTimes.start || times.end !== initialTimes.end || feedbackDirty);
  const guard = useDiscardGuard(dirty, onClose);

  const handleSubmit = async (values: TestDriveFeedbackValues) => {
    if (!data) return;

    if (!times.start || !times.end) {
      setTimeError("Enter when the drive started and when it ended.");
      return;
    }
    if (times.end <= times.start) {
      setTimeError("The drive must end after it starts.");
      return;
    }

    setTimeError(undefined);
    setError(null);
    setIsSaving(true);

    const result = await completeTestDriveAction({
      id: data.id,
      expectedUpdatedAt: data.updatedAt,
      actualStartTime: times.start,
      actualEndTime: times.end,
      feedback: values,
    });

    setIsSaving(false);

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
      return;
    }

    toast.success("Test Drive Completed Successfully");
    onDone();
  };

  // Pressing Complete with a missing field would otherwise look like nothing happened if the error is scrolled out of view.
  const handleInvalid = () => {
    toast.error("Please fix the highlighted fields.");
    document.getElementById(FORM_ID)?.querySelector('[role="alert"]')?.scrollIntoView({ block: "center" });
  };

  const requestSubmit = () => (document.getElementById(FORM_ID) as HTMLFormElement | null)?.requestSubmit();

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
      <Button
        onClick={requestSubmit}
        isLoading={isSaving}
        disabled={!data || blocked || isSaving}
        leftIcon={<CheckCircle2 className="size-4" />}
      >
        Complete Test Drive
      </Button>
    </>
  );

  return (
    <Modal
      isOpen
      onClose={isSaving ? () => undefined : guard.requestClose}
      title="Complete test drive"
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
            We couldn&apos;t load this test drive, or you don&apos;t have permission to complete it. Close
            this and try again.
          </p>
        ) : !data ? (
          <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <>
            {blocked && (
              <p
                role="alert"
                className="text-body-sm text-text-primary rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2"
              >
                This test drive is now {data.status.toLowerCase()}, so it can&apos;t be completed. Close this
                and refresh the page.
              </p>
            )}

            {notStarted && (
              <p
                role="status"
                className="text-body-sm text-text-primary rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2"
              >
                This appointment hasn&apos;t started yet. If the drive already took place, enter its real
                times. Otherwise close this and complete it afterwards.
              </p>
            )}

            {!data.checkedInAt && !notStarted && (
              <p role="status" className="text-caption text-text-subtle">
                This customer wasn&apos;t checked in, so the times below start from the booked time. Correct
                them if needed.
              </p>
            )}

            <section aria-labelledby="actual-times" className="flex flex-col gap-3">
              <h3 id="actual-times" className="text-label">
                When did the drive happen?
              </h3>
              <p className="text-body-sm text-text-muted">
                {formatDayLong(data.scheduledStart)}. Times are Dubai time and can&apos;t be in the future.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Started"
                  type="time"
                  required
                  value={times.start}
                  onChange={(event) => {
                    setTimes({ ...times, start: event.target.value });
                    setTimeError(undefined);
                  }}
                />
                <Input
                  label="Ended"
                  type="time"
                  required
                  value={times.end}
                  onChange={(event) => {
                    setTimes({ ...times, end: event.target.value });
                    setTimeError(undefined);
                  }}
                />
              </div>

              {timeError && (
                <p role="alert" className="text-body-sm text-red-500">
                  {timeError}
                </p>
              )}
            </section>

            <section
              aria-labelledby="feedback-heading"
              className="border-border flex flex-col gap-3 border-t pt-4"
            >
              <h3 id="feedback-heading" className="text-label">
                Feedback
              </h3>
              <TestDriveFeedbackForm
                formId={FORM_ID}
                hideActions
                onSubmit={handleSubmit}
                onInvalid={handleInvalid}
                onDirtyChange={setFeedbackDirty}
                errorMessage={error ?? undefined}
              />
            </section>
          </>
        )}
      </div>
    </Modal>
  );
}
