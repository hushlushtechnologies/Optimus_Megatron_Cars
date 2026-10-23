"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Modal } from "@/src/components/ui/modal";
import { Button } from "@/src/components/ui/button";
import { Select } from "@/src/components/ui/select";

import {
  bulkArchiveTestDrivesAction,
  bulkAssignTestDriveStaffAction,
  bulkCancelTestDrivesAction,
  bulkRestoreTestDrivesAction,
} from "@/app/admin/test-drives/bulk-actions";
import {
  BULK_CANCEL_SUGGESTIONS,
  BULK_ELIGIBLE_STATUSES,
  MAX_BULK_SELECTION,
} from "@/src/lib/utils/test-drive-bulk";
import type { BulkActionKind, BulkActionResponse, BulkResult } from "@/src/lib/types/test-drive-bulk";
import type { TestDriveListRow } from "@/src/lib/types/test-drive";

const TITLES: Record<BulkActionKind, string> = {
  cancel: "Cancel test drives",
  assign: "Assign staff",
  archive: "Archive test drives",
  restore: "Restore test drives",
};

const PAST_TENSE: Record<BulkActionKind, string> = {
  cancel: "cancelled",
  assign: "assigned",
  archive: "archived",
  restore: "restored",
};

interface Options {
  /** Only the ticked rows on the current page. */
  selectedRows: TestDriveListRow[];
  staff: { id: string; name: string }[];
  onFinished: () => void;
}

export function useTestDriveBulkActions({ selectedRows, staff, onFinished }: Options): {
  request: (kind: BulkActionKind) => void;
  dialogs: ReactNode;
} {
  const router = useRouter();
  const [kind, setKind] = useState<BulkActionKind | null>(null);
  const [result, setResult] = useState<BulkResult | null>(null);

  const request = (next: BulkActionKind) => {
    if (selectedRows.length > MAX_BULK_SELECTION) {
      toast.error(`Select no more than ${MAX_BULK_SELECTION} test drives at a time.`);
      return;
    }
    setKind(next);
  };

  const finished = (response: BulkActionResponse) => {
    if (response.result) {
      setResult(response.result);
      setKind(null);
      onFinished();
      router.refresh();
    }
  };

  const dialogs = (
    <>
      {kind && (
        <BulkFormDialog
          key={kind}
          kind={kind}
          rows={selectedRows}
          staff={staff}
          onClose={() => setKind(null)}
          onResponse={finished}
        />
      )}
      {result && <BulkResultDialog result={result} onClose={() => setResult(null)} />}
    </>
  );

  return { request, dialogs };
}

/* ---------- The form dialog (one per action) ---------- */

function BulkFormDialog({
  kind,
  rows,
  staff,
  onClose,
  onResponse,
}: {
  kind: BulkActionKind;
  rows: TestDriveListRow[];
  staff: { id: string; name: string }[];
  onClose: () => void;
  onResponse: (response: BulkActionResponse) => void;
}) {
  const [reason, setReason] = useState("");
  const [staffId, setStaffId] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eligible = rows.filter((row) => BULK_ELIGIBLE_STATUSES[kind].includes(row.status));
  const ids = rows.map((row) => row.id);

  const reasonTooShort = kind === "cancel" && reason.trim().length < 3;
  const canRun =
    !isRunning &&
    eligible.length > 0 &&
    (kind !== "cancel" || !reasonTooShort) &&
    (kind !== "assign" || !!staffId);

  const run = async () => {
    setError(null);
    setIsRunning(true);
    try {
      const response =
        kind === "cancel"
          ? await bulkCancelTestDrivesAction({ ids, reason })
          : kind === "assign"
            ? await bulkAssignTestDriveStaffAction({ ids, staffId })
            : kind === "restore"
              ? await bulkRestoreTestDrivesAction({ ids })
              : await bulkArchiveTestDrivesAction({ ids });

      if (response.error || !response.result) {
        setError(response.error ?? "Something went wrong. Nothing was changed.");
        return;
      }
      onResponse(response);
    } catch {
      setError("Something went wrong. Check the list before trying again.");
    } finally {
      setIsRunning(false);
    }
  };

  const confirmLabel =
    kind === "cancel"
      ? "Cancel test drives"
      : kind === "assign"
        ? "Assign host"
        : kind === "restore"
          ? "Restore"
          : "Archive";

  return (
    <Modal
      isOpen
      onClose={() => {
        if (!isRunning) onClose();
      }}
      title={TITLES[kind]}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isRunning}>
            Back
          </Button>
          <Button
            variant={kind === "cancel" ? "destructive" : "primary"}
            onClick={run}
            isLoading={isRunning}
            disabled={!canRun}
          >
            {confirmLabel}
            {eligible.length > 0 ? ` (${eligible.length})` : ""}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-body-sm text-text-muted">
          {eligible.length} of {rows.length} selected {rows.length === 1 ? "test drive" : "test drives"} can
          be {PAST_TENSE[kind]}.
          {eligible.length < rows.length &&
            " The others will be skipped, and you'll see why when it finishes."}{" "}
          Each one is checked again just before it changes.
        </p>

        {kind === "cancel" && (
          <div className="flex flex-col gap-2">
            <label htmlFor="bulk-cancel-reason" className="text-label">
              Reason for cancelling
            </label>
            <textarea
              id="bulk-cancel-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={500}
              rows={3}
              placeholder="This reason is saved on every cancelled test drive."
              className="border-border bg-card text-body text-text-primary placeholder:text-text-subtle focus-visible:ring-primary w-full rounded-md border px-3 py-2 focus-visible:ring-2 focus-visible:outline-none"
            />
            <div className="flex flex-wrap gap-1.5">
              {BULK_CANCEL_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setReason(suggestion)}
                  className="border-border text-text-muted hover:border-primary/40 hover:text-text-primary rounded-full border px-2.5 py-1 text-xs transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <p className="text-caption text-text-subtle">
              Cancelling can&apos;t be undone. The vehicle and host are released, and the people involved are
              notified.
            </p>
          </div>
        )}

        {kind === "assign" && (
          <div className="flex flex-col gap-2">
            <Select
              label="Host"
              placeholder="Choose a staff member"
              options={staff.map((member) => ({ value: member.id, label: member.name }))}
              value={staffId}
              onChange={(event) => setStaffId(event.target.value)}
            />
            <p className="text-caption text-text-subtle">
              Their leave and other appointments are checked for each test drive. A clash is skipped, never
              forced.
            </p>
          </div>
        )}

        {kind === "archive" && (
          <p className="text-caption text-text-subtle">
            Archived test drives leave this list. You can find and restore them in the Archived view. Only
            finished test drives (completed, cancelled, rejected or no show) can be archived.
          </p>
        )}

        {kind === "restore" && (
          <p className="text-caption text-text-subtle">
            Restored test drives return to the main list with the status they had.
          </p>
        )}

        {eligible.length === 0 && (
          <p
            role="alert"
            className="text-body-sm text-text-primary rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2"
          >
            None of the selected test drives can be {PAST_TENSE[kind]}.
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

/* ---------- The results dialog ---------- */

function BulkResultDialog({ result, onClose }: { result: BulkResult; onClose: () => void }) {
  const done = result.succeeded.length;
  const skipped = result.skipped.length;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`${TITLES[result.kind]}: results`}
      footer={<Button onClick={onClose}>Done</Button>}
    >
      <div className="flex flex-col gap-4" role="status">
        <p className="text-body text-text-primary">
          {done} {done === 1 ? "test drive" : "test drives"} {PAST_TENSE[result.kind]}
          {skipped > 0 ? `, ${skipped} skipped.` : "."}
        </p>

        {done > 0 && (
          <p className="text-body-sm text-text-muted">
            {result.succeeded.map((row) => row.number).join(", ")}
          </p>
        )}

        {skipped > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-label">Skipped</p>
            <ul className="border-border max-h-64 divide-y overflow-y-auto rounded-md border">
              {result.skipped.map((row) => (
                <li key={row.id} className="px-3 py-2">
                  <p className="text-body-sm text-text-primary font-medium">{row.number}</p>
                  <p className="text-caption text-text-muted">{row.reason}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}
