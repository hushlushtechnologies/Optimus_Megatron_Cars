"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApproveTestDriveDialog } from "@/src/components/test-drives/actions/approve-test-drive-dialog";
import { RejectTestDriveDialog } from "@/src/components/test-drives/actions/reject-test-drive-dialog";
import { CancelTestDriveDialog } from "@/src/components/test-drives/actions/cancel-test-drive-dialog";
import { NoShowTestDriveDialog } from "@/src/components/test-drives/actions/no-show-test-drive-dialog";
import { AssignTestDriveStaffDialog } from "@/src/components/test-drives/actions/assign-test-drive-staff-dialog";
import { AssignmentHistoryDialog } from "@/src/components/test-drives/actions/assignment-history-dialog";
import { EditTestDriveDialog } from "@/src/components/test-drives/actions/edit-test-drive-dialog";
import { RescheduleTestDriveDialog } from "@/src/components/test-drives/actions/reschedule-test-drive-dialog";
import { CheckInTestDriveDialog } from "@/src/components/test-drives/actions/check-in-test-drive-dialog";
import { CompleteTestDriveDialog } from "@/src/components/test-drives/actions/complete-test-drive-dialog";
import { EditFeedbackDialog } from "@/src/components/test-drives/actions/edit-feedback-dialog";
import {
  TEST_DRIVE_ACTION_ARRIVES_IN,
  TEST_DRIVE_ACTION_META,
  type TestDriveActionKey,
} from "@/src/lib/utils/test-drive-actions";
import type { TestDriveActionSubject } from "@/src/lib/types/test-drive";

type DialogAction =
  | "approve"
  | "reject"
  | "cancel"
  | "no_show"
  | "assign_staff"
  | "reassign_staff"
  | "edit"
  | "reschedule"
  | "check_in"
  | "complete";

interface OpenDialog {
  action: DialogAction;
  subject: TestDriveActionSubject;
}

const DIALOG_ACTIONS: TestDriveActionKey[] = [
  "approve",
  "reject",
  "cancel",
  "no_show",
  "assign_staff",
  "reassign_staff",
  "edit",
  "reschedule",
  "check_in",
  "complete",
];

/**
 * One place that turns "the person chose an action" into the right dialog.
 * The table, the calendar, the detail page and the check-in desk all use it,
 * so every screen behaves identically.
 *
 * Usage:
 *   const actions = useTestDriveActions();
 *   actions.request("approve", row);          // from a menu or button
 *   actions.viewAssignmentHistory(row);       // read-only, works on any status
 *   actions.editFeedback(row);                // add or correct a completed drive's feedback
 *   return <>... {actions.dialogs}</>;        // render the dialogs somewhere in the page
 */
export function useTestDriveActions(): {
  request: (action: TestDriveActionKey, subject: TestDriveActionSubject) => void;
  viewAssignmentHistory: (subject: TestDriveActionSubject) => void;
  editFeedback: (subject: TestDriveActionSubject) => void;
  dialogs: ReactNode;
} {
  const router = useRouter();
  const [open, setOpen] = useState<OpenDialog | null>(null);
  const [historyFor, setHistoryFor] = useState<TestDriveActionSubject | null>(null);
  const [feedbackFor, setFeedbackFor] = useState<TestDriveActionSubject | null>(null);

  const request = (action: TestDriveActionKey, subject: TestDriveActionSubject) => {
    if (DIALOG_ACTIONS.includes(action)) {
      setOpen({ action: action as DialogAction, subject });
      return;
    }

    // Every action now has a dialog, so this is only a safety net for a future one.
    toast.info(
      `${TEST_DRIVE_ACTION_META[action].label} arrives in Sprint 5 ${TEST_DRIVE_ACTION_ARRIVES_IN[action]}`,
    );
  };

  const viewAssignmentHistory = (subject: TestDriveActionSubject) => setHistoryFor(subject);
  const editFeedback = (subject: TestDriveActionSubject) => setFeedbackFor(subject);

  const close = () => setOpen(null);

  // After a successful action: close, then re-fetch so every screen shows the new state.
  const done = () => {
    setOpen(null);
    router.refresh();
  };

  // Each dialog is mounted only while it's open, so every opening starts clean.
  const dialogs = (
    <>
      {open?.action === "approve" && (
        <ApproveTestDriveDialog subject={open.subject} onClose={close} onDone={done} />
      )}
      {open?.action === "reject" && (
        <RejectTestDriveDialog subject={open.subject} onClose={close} onDone={done} />
      )}
      {open?.action === "cancel" && (
        <CancelTestDriveDialog subject={open.subject} onClose={close} onDone={done} />
      )}
      {open?.action === "no_show" && (
        <NoShowTestDriveDialog subject={open.subject} onClose={close} onDone={done} />
      )}
      {(open?.action === "assign_staff" || open?.action === "reassign_staff") && (
        <AssignTestDriveStaffDialog subject={open.subject} onClose={close} onDone={done} />
      )}
      {open?.action === "edit" && (
        <EditTestDriveDialog subject={open.subject} onClose={close} onDone={done} />
      )}
      {open?.action === "reschedule" && (
        <RescheduleTestDriveDialog subject={open.subject} onClose={close} onDone={done} />
      )}
      {open?.action === "check_in" && (
        <CheckInTestDriveDialog subject={open.subject} onClose={close} onDone={done} />
      )}
      {open?.action === "complete" && (
        <CompleteTestDriveDialog subject={open.subject} onClose={close} onDone={done} />
      )}
      {historyFor && <AssignmentHistoryDialog subject={historyFor} onClose={() => setHistoryFor(null)} />}
      {feedbackFor && (
        <EditFeedbackDialog
          subject={feedbackFor}
          onClose={() => setFeedbackFor(null)}
          onDone={() => {
            setFeedbackFor(null);
            router.refresh();
          }}
        />
      )}
    </>
  );

  return { request, viewAssignmentHistory, editFeedback, dialogs };
}
