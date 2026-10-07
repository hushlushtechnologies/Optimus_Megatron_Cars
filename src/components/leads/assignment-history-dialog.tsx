"use client";

import { useEffect, useState } from "react";

import { formatDistanceToNow } from "date-fns";

import { Modal } from "@/src/components/ui/modal";

import { getLeadAssignmentHistoryAction } from "@/app/admin/leads/[id]/actions";

import type { LeadAssignmentHistoryEntry } from "@/src/lib/supabase/lead-detail-queries";

/* =========================================================
   TYPES
========================================================= */

interface AssignmentHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
}

interface AssignmentHistoryState {
  leadId: string | null;
  entries: LeadAssignmentHistoryEntry[];
}

/* =========================================================
   COMPONENT
========================================================= */

export function AssignmentHistoryDialog({ isOpen, onClose, leadId }: AssignmentHistoryDialogProps) {
  const [historyState, setHistoryState] = useState<AssignmentHistoryState>({
    leadId: null,
    entries: [],
  });

  /* =========================================================
     LOAD ASSIGNMENT HISTORY
  ========================================================= */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;

    getLeadAssignmentHistoryAction(leadId)
      .then((entries) => {
        if (cancelled) {
          return;
        }

        setHistoryState({
          leadId,
          entries,
        });
      })
      .catch((error: unknown) => {
        console.error("Unable to load lead assignment history:", error);

        if (cancelled) {
          return;
        }

        setHistoryState({
          leadId,
          entries: [],
        });
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, leadId]);

  /* =========================================================
     DERIVED STATE
  ========================================================= */

  const isLoading = isOpen && historyState.leadId !== leadId;

  const entries = historyState.leadId === leadId ? historyState.entries : [];

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Staff Assignment History">
      {isLoading ? (
        <p className="text-body-sm text-text-muted">Loading...</p>
      ) : entries.length === 0 ? (
        <p className="text-body-sm text-text-muted">
          No reassignments yet — this lead&apos;s staff hasn&apos;t changed.
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {entries.map((entry) => (
            <li key={entry.id} className="surface-card p-3">
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
