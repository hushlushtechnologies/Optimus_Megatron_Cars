"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Modal } from "@/src/components/ui/modal";
import { getAssignmentHistoryAction } from "@/app/admin/customers/[id]/vehicle-actions";

interface AssignmentHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  relationId: string | null;
}

export function AssignmentHistoryDialog({ isOpen, onClose, relationId }: AssignmentHistoryDialogProps) {
  const [entries, setEntries] = useState<Awaited<ReturnType<typeof getAssignmentHistoryAction>>>([]);

  useEffect(() => {
    if (isOpen && relationId) {
      getAssignmentHistoryAction(relationId).then(setEntries);
    }
  }, [isOpen, relationId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Staff Assignment History" size="sm">
      {entries.length === 0 ? (
        <p className="text-body-sm text-text-muted">No reassignments recorded yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {entries.map((entry) => (
            <li key={entry.id} className="border-border border-b pb-2 last:border-0">
              <p className="text-body-sm text-text-primary">
                {entry.previousStaffName} → <span className="text-primary-text">{entry.newStaffName}</span>
              </p>
              <p className="text-caption text-text-subtle">
                by {entry.changedByName} ·{" "}
                {formatDistanceToNow(new Date(entry.changedAt), { addSuffix: true })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
