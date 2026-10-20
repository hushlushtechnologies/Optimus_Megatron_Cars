"use client";

import { ReasonDialog } from "@/src/components/test-drives/actions/reason-dialog";
import { cancelTestDriveAction } from "@/app/admin/test-drives/actions";
import type { TestDriveActionSubject } from "@/src/lib/types/test-drive";

const SUGGESTIONS = [
  "Customer asked to cancel",
  "Vehicle isn't available",
  "Staff isn't available",
  "Couldn't reach the customer",
];

interface CancelTestDriveDialogProps {
  subject: TestDriveActionSubject;
  onClose: () => void;
  onDone: () => void;
}

export function CancelTestDriveDialog({ subject, onClose, onDone }: CancelTestDriveDialogProps) {
  const reserved = subject.status !== "Pending";

  return (
    <ReasonDialog
      subject={subject}
      title="Cancel test drive"
      intro={
        reserved
          ? "The appointment is cancelled and the vehicle and host are released for other bookings. This can't be undone, so a new request would be needed to book it again."
          : "The request is cancelled. This can't be undone, so a new request would be needed to book it again."
      }
      label="Reason for cancelling"
      placeholder="Tell the team why this is being cancelled."
      suggestions={SUGGESTIONS}
      confirmLabel="Cancel Test Drive"
      successMessage="Test Drive Cancelled"
      onSubmit={(reason) => cancelTestDriveAction({ id: subject.id, reason })}
      onClose={onClose}
      onDone={onDone}
    />
  );
}
