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
  return (
    <SelectActionDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Move Lead to Stage"
      selectLabel="Stage"
      options={stages.filter((s) => s.id !== currentStageId).map((s) => ({ value: s.id, label: s.name }))}
      confirmLabel="Move"
      onConfirm={async (newStageId) => {
        const result = await moveLeadStage(leadId, newStageId);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Lead moved successfully");
        onMoved(newStageId);
      }}
    />
  );
}
