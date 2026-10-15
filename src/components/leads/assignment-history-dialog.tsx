"use client";

import { useEffect, useState } from "react";

import { formatDistanceToNow } from "date-fns";

import { Modal } from "@/src/components/ui/modal";

import { getLeadAssignmentHistoryAction } from "@/app/admin/leads/[id]/actions";

import type { LeadAssignmentHistoryEntry } from "@/src/lib/supabase/lead-detail-queries";

// =========================================================
// TYPES
// =========================================================

interface AssignmentHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
}

// =========================================================
// COMPONENT
// =========================================================

export function AssignmentHistoryDialog({ isOpen, onClose, leadId }: AssignmentHistoryDialogProps) {
  // =======================================================
  // STATE
  // =======================================================

  // null = loading
  // [] = loaded, no history
  // [...] = loaded history entries

  const [entries, setEntries] = useState<LeadAssignmentHistoryEntry[] | null>(null);

  // =======================================================
  // LOAD ASSIGNMENT HISTORY
  // =======================================================

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;

    // Reset loading state whenever the dialog opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEntries(null);

    getLeadAssignmentHistoryAction(leadId)
      .then((result) => {
        if (cancelled) {
          return;
        }

        setEntries(result);
      })
      .catch((error: unknown) => {
        console.error("Unable to load lead assignment history:", error);

        if (cancelled) {
          return;
        }

        // Prevent the dialog from loading indefinitely.
        setEntries([]);
      });

    // Ignore responses from outdated requests.
    return () => {
      cancelled = true;
    };
  }, [isOpen, leadId]);

  // =======================================================
  // DERIVED STATE
  // =======================================================

  const isLoading = entries === null;

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Staff Assignment History">
      {isLoading ? (
        // =================================================
        // LOADING STATE
        // =================================================

        <p className="text-body-sm text-text-muted">Loading...</p>
      ) : entries.length === 0 ? (
        // =================================================
        // EMPTY STATE
        // =================================================

        <p className="text-body-sm text-text-muted">
          No reassignments yet — this lead&apos;s staff hasn&apos;t changed.
        </p>
      ) : (
        // =================================================
        // ASSIGNMENT HISTORY
        // =================================================

        <ol className="flex flex-col gap-3">
          {entries.map((entry) => (
            <li key={entry.id} className="surface-card p-3">
              {/* ==========================================
                  ASSIGNMENT DETAILS
              ========================================== */}

              <p className="text-body-sm text-text-primary">
                {entry.previousStaffName ? (
                  <>
                    Reassigned from <strong>{entry.previousStaffName}</strong> to{" "}
                    <strong>{entry.newStaffName}</strong>
                  </>
                ) : (
                  <>
                    Assigned to <strong>{entry.newStaffName}</strong>
                  </>
                )}
              </p>

              {/* ==========================================
                  CHANGED BY / TIMESTAMP
              ========================================== */}

              <p className="text-caption text-text-subtle mt-1">
                By {entry.changedByName} ·{" "}
                {formatDistanceToNow(new Date(entry.changedAt), {
                  addSuffix: true,
                })}
              </p>
            </li>
          ))}
        </ol>
      )}
    </Modal>
  );
}
