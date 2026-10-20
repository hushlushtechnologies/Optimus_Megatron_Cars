"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/src/components/shared/confirm-dialog";
import { markNoShowAction } from "@/app/admin/test-drives/actions";
import type { TestDriveActionSubject } from "@/src/lib/types/test-drive";

interface NoShowTestDriveDialogProps {
  subject: TestDriveActionSubject;
  onClose: () => void;
  onDone: () => void;
}

export function NoShowTestDriveDialog({ subject, onClose, onDone }: NoShowTestDriveDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <ConfirmDialog
      isOpen
      onClose={onClose}
      onConfirm={async () => {
        setIsLoading(true);
        const result = await markNoShowAction({ id: subject.id });
        setIsLoading(false);

        if (result.error) {
          toast.error(result.error);
          return;
        }

        toast.success("Marked as No Show");
        onDone();
      }}
      title="Mark as no show?"
      description={`${subject.customer_name} didn't arrive for ${subject.test_drive_number}. The vehicle and host are released, and this can't be undone.`}
      confirmLabel="Mark No Show"
      variant="danger"
      isLoading={isLoading}
    />
  );
}
