"use client";

import { AlertOctagon } from "lucide-react";
import { Modal } from "@/src/components/ui/modal";
import { Button } from "@/src/components/ui/button";

interface ErrorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorDialog({
  isOpen,
  onClose,
  title = "Something went wrong",
  description = "Please try again. If the problem continues, contact support.",
  onRetry,
}: ErrorDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {onRetry && <Button onClick={onRetry}>Try Again</Button>}
        </>
      }
    >
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-red-500/10 text-red-400">
          <AlertOctagon className="size-7" aria-hidden="true" />
        </span>
        <p className="text-body-sm text-text-muted">{description}</p>
      </div>
    </Modal>
  );
}
