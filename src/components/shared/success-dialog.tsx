"use client";

import { CheckCircle2 } from "lucide-react";
import { Modal } from "@/src/components/ui/modal";
import { Button } from "@/src/components/ui/button";

interface SuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  actionLabel?: string;
}

export function SuccessDialog({
  isOpen,
  onClose,
  title,
  description,
  actionLabel = "Done",
}: SuccessDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={<Button onClick={onClose}>{actionLabel}</Button>}
    >
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
          <CheckCircle2 className="size-7" aria-hidden="true" />
        </span>
        {description && <p className="text-body-sm text-text-muted">{description}</p>}
      </div>
    </Modal>
  );
}
