"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Modal } from "@/src/components/ui/modal";
import { Skeleton } from "@/src/components/ui/skeleton";
import { TestDriveActionSummary } from "@/src/components/test-drives/actions/test-drive-action-summary";
import { TestDriveFeedbackForm } from "@/src/components/test-drives/test-drive-feedback-form";
import { useDiscardGuard } from "@/src/components/test-drives/actions/use-discard-guard";
import {
  getTestDriveFeedbackAction,
  saveTestDriveFeedbackAction,
} from "@/app/admin/test-drives/complete-actions";
import type { TestDriveFeedbackValues } from "@/src/lib/validation/test-drive-feedback";
import type { TestDriveActionSubject, TestDriveFeedbackLoad } from "@/src/lib/types/test-drive";

const FORM_ID = "edit-test-drive-feedback";

interface EditFeedbackDialogProps {
  subject: TestDriveActionSubject;
  onClose: () => void;
  /** Called after feedback was saved. */
  onDone: () => void;
}

// The parent only renders this while it's open, so every opening loads the current feedback and starts clean.
export function EditFeedbackDialog({ subject, onClose, onDone }: EditFeedbackDialogProps) {
  const [load, setLoad] = useState<TestDriveFeedbackLoad | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getTestDriveFeedbackAction({ id: subject.id })
      .then((result) => {
        if (cancelled) return;
        if (!result) setLoadFailed(true);
        else setLoad(result);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [subject.id]);

  const guard = useDiscardGuard(dirty, onClose);

  const feedback = load && load.status === "ok" ? load.feedback : null;
  const ready = !!load && load.status === "ok";
  const loadError = loadFailed || (!!load && load.status === "error");

  const handleSubmit = async (values: TestDriveFeedbackValues) => {
    setError(null);
    setIsSaving(true);

    const result = await saveTestDriveFeedbackAction({ id: subject.id, feedback: values });

    setIsSaving(false);

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
      return;
    }

    toast.success("Feedback Saved Successfully");
    onDone();
  };

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
      <Button onClick={requestSubmit} isLoading={isSaving} disabled={!ready || isSaving}>
        Save Feedback
      </Button>
    </>
  );

  return (
    <Modal
      isOpen
      onClose={isSaving ? () => undefined : guard.requestClose}
      title={feedback ? "Edit feedback" : "Add feedback"}
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

        {loadError ? (
          <p
            role="alert"
            className="text-body-sm text-text-primary rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2"
          >
            We couldn&apos;t load the feedback, or you don&apos;t have permission to change it. Close this and
            try again.
          </p>
        ) : !load ? (
          <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <TestDriveFeedbackForm
            formId={FORM_ID}
            hideActions
            defaultValues={
              feedback
                ? {
                    interest_level: feedback.interest_level ?? undefined,
                    staff_feedback: feedback.staff_feedback ?? "",
                    customer_feedback: feedback.customer_feedback ?? "",
                    next_step: feedback.next_step ?? "",
                    follow_up_required: feedback.follow_up_required,
                  }
                : undefined
            }
            onSubmit={handleSubmit}
            onInvalid={handleInvalid}
            onDirtyChange={setDirty}
            errorMessage={error ?? undefined}
          />
        )}
      </div>
    </Modal>
  );
}
