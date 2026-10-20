"use client";

import { ReasonDialog } from "@/src/components/test-drives/actions/reason-dialog";
import { rejectTestDriveAction } from "@/app/admin/test-drives/actions";
import type { TestDriveActionSubject } from "@/src/lib/types/test-drive";

const SUGGESTIONS = [
  "Vehicle isn't available that day",
  "Showroom is closed that day",
  "Couldn't reach the customer",
  "Duplicate request",
];

interface RejectTestDriveDialogProps {
  subject: TestDriveActionSubject;
  onClose: () => void;
  onDone: () => void;
}

export function RejectTestDriveDialog({ subject, onClose, onDone }: RejectTestDriveDialogProps) {
  return (
    <ReasonDialog
      subject={subject}
      title="Reject test drive request"
      intro="The request is declined and nothing is reserved. The reason is saved with the request and shown in its history."
      label="Reason for rejecting"
      placeholder="Tell the team why this request is being declined."
      suggestions={SUGGESTIONS}
      confirmLabel="Reject Request"
      successMessage="Test Drive Rejected"
      onSubmit={(reason) => rejectTestDriveAction({ id: subject.id, reason })}
      onClose={onClose}
      onDone={onDone}
    />
  );
}
