"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Modal } from "@/src/components/ui/modal";
import { Skeleton } from "@/src/components/ui/skeleton";
import { getAssignmentHistoryAction } from "@/app/admin/test-drives/assignment-actions";
import { formatDateTimeFull } from "@/src/lib/utils/test-drive-format";
import type { TestDriveActionSubject, TestDriveAssignmentHistoryItem } from "@/src/lib/types/test-drive";

interface AssignmentHistoryDialogProps {
  subject: TestDriveActionSubject;
  onClose: () => void;
}

function Change({ item }: { item: TestDriveAssignmentHistoryItem }) {
  if (!item.previous_staff_name) {
    return (
      <p className="text-body-sm text-text-primary">
        Assigned to <span className="font-medium">{item.new_staff_name ?? "Unknown"}</span>
      </p>
    );
  }

  if (!item.new_staff_name) {
    return (
      <p className="text-body-sm text-text-primary">
        Unassigned (was <span className="font-medium">{item.previous_staff_name}</span>)
      </p>
    );
  }

  return (
    <p className="text-body-sm text-text-primary flex flex-wrap items-center gap-x-2 gap-y-0.5">
      <span className="text-text-muted">{item.previous_staff_name}</span>
      <ArrowRight className="text-text-subtle size-3.5 shrink-0" aria-label="reassigned to" />
      <span className="font-medium">{item.new_staff_name}</span>
    </p>
  );
}

// The parent only renders this while it's open, so it loads fresh every time.
export function AssignmentHistoryDialog({ subject, onClose }: AssignmentHistoryDialogProps) {
  const [state, setState] = useState<{ id: string; items: TestDriveAssignmentHistoryItem[] | null } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    getAssignmentHistoryAction({ id: subject.id })
      .then((items) => {
        if (!cancelled) setState({ id: subject.id, items });
      })
      .catch(() => {
        if (!cancelled) setState({ id: subject.id, items: null });
      });

    return () => {
      cancelled = true;
    };
  }, [subject.id]);

  const loading = !state || state.id !== subject.id;
  const items = state?.items ?? null;
  const failed = !loading && items === null;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Assignment history"
      footer={
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="border-border bg-card-hover/40 rounded-md border p-3">
          <p className="text-caption text-text-subtle">{subject.test_drive_number}</p>
          <p className="text-text-primary font-medium">{subject.customer_name}</p>
          <p className="text-body-sm text-text-muted mt-1">
            Current host: {subject.staff_name ?? <span className="text-text-subtle">Unassigned</span>}
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading assignment history">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-52" />
                <Skeleton className="h-3 w-40" />
              </div>
            ))}
          </div>
        ) : failed ? (
          <p
            role="alert"
            className="text-body-sm text-text-primary rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2"
          >
            We couldn&apos;t load the history. Close this and try again.
          </p>
        ) : !items || items.length === 0 ? (
          <p className="text-body-sm text-text-muted">No host has been assigned to this test drive yet.</p>
        ) : (
          <ol className="border-border relative flex flex-col gap-5 border-l pl-4">
            {items.map((item) => (
              <li key={item.id} className="relative">
                <span
                  className="bg-primary absolute top-1.5 -left-[21px] size-2.5 rounded-full"
                  aria-hidden="true"
                />
                <Change item={item} />
                <p className="text-caption text-text-subtle mt-0.5">
                  By {item.changed_by_name} ·{" "}
                  <time dateTime={item.changed_at}>{formatDateTimeFull(item.changed_at)}</time>
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Modal>
  );
}
