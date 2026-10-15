"use client";

import { toast } from "sonner";
import { SelectActionDialog } from "@/src/components/shared/select-action-dialog";
import { moveLeadStage } from "@/app/admin/leads/actions";
import type { LeadStage } from "@/src/lib/types/lead";

interface MoveStageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  currentStageId: string;
  stages: LeadStage[];
  onMoved: (newStageId: string) => void;
}

export function MoveStageDialog({
  isOpen,
  onClose,
  leadId,
  currentStageId,
  stages,
  onMoved,
}: MoveStageDialogProps) {
  const current = stages.find((s) => s.id === currentStageId);
  const isClosed = !!current && current.stage_type !== "open";

  return (
    <SelectActionDialog
      isOpen={isOpen}
      onClose={onClose}
      title={isClosed ? "Reopen Lead" : "Move Lead to Stage"}
      selectLabel={isClosed ? "Reopen in Stage" : "Stage"}
      // Only open stages: closing a lead goes through Mark Won / Mark Lost.
      options={stages
        .filter((s) => s.stage_type === "open" && s.id !== currentStageId)
        .map((s) => ({ value: s.id, label: s.name }))}
      confirmLabel={isClosed ? "Reopen" : "Move"}
      onConfirm={async (newStageId) => {
        const result = await moveLeadStage(leadId, newStageId);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success(isClosed ? "Lead reopened" : "Lead moved successfully");
        onMoved(newStageId);
      }}
    />
  );
}
