"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { IconButton } from "@/src/components/ui/icon-button";
import { Dropdown, DropdownTrigger, DropdownContent } from "@/src/components/ui/dropdown";
import { ConfirmDialog } from "@/src/components/shared/confirm-dialog";
import { LeadFollowUpCard } from "@/src/components/leads/lead-follow-up-card";
import { FollowUpDialog } from "@/src/components/leads/follow-up-dialog";
import {
  completeFollowUp,
  cancelFollowUp,
  markFollowUpMissed,
} from "@/app/admin/leads/[id]/follow-up-actions";
import { MoreVertical, CheckCircle2, CalendarClock, XCircle, AlertTriangle, Pencil } from "lucide-react";
import type { LeadFollowUp } from "@/src/lib/types/lead";

interface FollowUpListProps {
  leadId: string;
  followUps: LeadFollowUp[];
}

export function FollowUpList({ leadId, followUps }: FollowUpListProps) {
  const [dialogState, setDialogState] = useState<{
    mode: "create" | "edit" | "reschedule";
    followUp?: LeadFollowUp;
  } | null>(null);
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);

  const runAction = async (action: () => Promise<{ error: string | null }>, successMessage: string) => {
    const result = await action();
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(successMessage);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          leftIcon={<Plus className="size-4" />}
          onClick={() => setDialogState({ mode: "create" })}
        >
          Schedule Follow-Up
        </Button>
      </div>

      {followUps.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <CalendarClock className="text-text-subtle size-8" aria-hidden="true" />
          <p className="text-body-lg text-text-primary">No follow-ups scheduled yet</p>
          <p className="text-body-sm text-text-muted">Schedule one to keep this lead moving.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {followUps.map((followUp) => (
            <LeadFollowUpCard
              key={followUp.id}
              followUp={followUp}
              actions={
                followUp.status === "Scheduled" ? (
                  <Dropdown>
                    <DropdownTrigger>
                      <IconButton aria-label="Follow-up actions" variant="ghost" size="sm">
                        <MoreVertical className="size-3.5" />
                      </IconButton>
                    </DropdownTrigger>
                    <DropdownContent align="end" className="w-44 py-1">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => setDialogState({ mode: "edit", followUp })}
                        className="text-body-sm text-text-primary hover:bg-card-hover flex w-full items-center gap-2.5 px-4 py-2 text-left"
                      >
                        <Pencil className="text-text-muted size-4" aria-hidden="true" />
                        Edit
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() =>
                          runAction(() => completeFollowUp(followUp.id, leadId), "Follow-up completed")
                        }
                        className="text-body-sm text-text-primary hover:bg-card-hover flex w-full items-center gap-2.5 px-4 py-2 text-left"
                      >
                        <CheckCircle2 className="text-text-muted size-4" aria-hidden="true" />
                        Mark Complete
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => setDialogState({ mode: "reschedule", followUp })}
                        className="text-body-sm text-text-primary hover:bg-card-hover flex w-full items-center gap-2.5 px-4 py-2 text-left"
                      >
                        <CalendarClock className="text-text-muted size-4" aria-hidden="true" />
                        Reschedule
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() =>
                          runAction(() => markFollowUpMissed(followUp.id, leadId), "Follow-up marked missed")
                        }
                        className="text-body-sm text-text-primary hover:bg-card-hover flex w-full items-center gap-2.5 px-4 py-2 text-left"
                      >
                        <AlertTriangle className="text-text-muted size-4" aria-hidden="true" />
                        Mark Missed
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => setPendingCancelId(followUp.id)}
                        className="text-body-sm hover:bg-card-hover flex w-full items-center gap-2.5 px-4 py-2 text-left text-red-400"
                      >
                        <XCircle className="size-4" aria-hidden="true" />
                        Cancel
                      </button>
                    </DropdownContent>
                  </Dropdown>
                ) : undefined
              }
            />
          ))}
        </div>
      )}

      {dialogState && (
        <FollowUpDialog
          isOpen={!!dialogState}
          onClose={() => setDialogState(null)}
          leadId={leadId}
          mode={dialogState.mode}
          followUp={dialogState.followUp}
        />
      )}

      <ConfirmDialog
        isOpen={!!pendingCancelId}
        onClose={() => setPendingCancelId(null)}
        onConfirm={async () => {
          if (!pendingCancelId) return;
          await runAction(() => cancelFollowUp(pendingCancelId, leadId), "Follow-up cancelled");
          setPendingCancelId(null);
        }}
        title="Cancel this follow-up?"
        description="This marks the follow-up as cancelled. It stays on record but no longer counts toward follow-ups due."
        confirmLabel="Cancel Follow-Up"
        variant="danger"
      />
    </div>
  );
}
