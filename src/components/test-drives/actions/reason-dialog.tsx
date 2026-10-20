"use client";

import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Modal } from "@/src/components/ui/modal";
import { Textarea } from "@/src/components/ui/textarea";
import { TestDriveActionSummary } from "@/src/components/test-drives/actions/test-drive-action-summary";
import type { TestDriveActionResult, TestDriveActionSubject } from "@/src/lib/types/test-drive";

const MIN_LENGTH = 3;
const MAX_LENGTH = 500;

interface ReasonDialogProps {
  subject: TestDriveActionSubject;
  title: string;
  intro: ReactNode;
  label: string;
  placeholder: string;
  /** One-tap starting points. They fill the box, and the person can still edit them. */
  suggestions: string[];
  confirmLabel: string;
  successMessage: string;
  onSubmit: (reason: string) => Promise<TestDriveActionResult>;
  onClose: () => void;
  onDone: () => void;
}

/** The shared "this needs a reason" dialog used by Reject and Cancel. */
export function ReasonDialog({
  subject,
  title,
  intro,
  label,
  placeholder,
  suggestions,
  confirmLabel,
  successMessage,
  onSubmit,
  onClose,
  onDone,
}: ReasonDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    const trimmed = reason.trim();
    if (trimmed.length < MIN_LENGTH) {
      setError(`Please give a reason (at least ${MIN_LENGTH} characters).`);
      return;
    }

    setError(null);
    setIsSaving(true);
    const result = await onSubmit(trimmed);
    setIsSaving(false);

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
      return;
    }

    toast.success(successMessage);
    onDone();
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Go Back
          </Button>
          <Button variant="destructive" onClick={handleSubmit} isLoading={isSaving}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <TestDriveActionSummary subject={subject} />

        <p className="text-body-sm text-text-muted">{intro}</p>

        <div className="flex flex-col gap-2">
          <p className="text-caption text-text-subtle">Quick reasons</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion}
                type="button"
                size="sm"
                variant={reason === suggestion ? "outline" : "secondary"}
                aria-pressed={reason === suggestion}
                onClick={() => {
                  setReason(suggestion);
                  setError(null);
                }}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Textarea
            label={label}
            placeholder={placeholder}
            rows={3}
            maxLength={MAX_LENGTH}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              if (error) setError(null);
            }}
          />
          <p className="text-caption text-text-subtle text-right">
            {reason.length}/{MAX_LENGTH}
          </p>
        </div>

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
