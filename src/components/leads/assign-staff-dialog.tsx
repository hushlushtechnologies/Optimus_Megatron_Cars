"use client";

import { toast } from "sonner";
import { SelectActionDialog } from "@/src/components/shared/select-action-dialog";
import { assignLeadStaff } from "@/app/admin/leads/actions";
import type { StaffOption } from "@/src/lib/supabase/lead-lookups";

interface AssignStaffDialogProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  currentStaffId: string | null;
  staffOptions: StaffOption[];
  onAssigned: (staffId: string, staffName: string) => void;
}

export function AssignStaffDialog({
  isOpen,
  onClose,
  leadId,
  currentStaffId,
  staffOptions,
  onAssigned,
}: AssignStaffDialogProps) {
  return (
    <SelectActionDialog
      isOpen={isOpen}
      onClose={onClose}
      title={currentStaffId ? "Reassign Staff" : "Assign Staff"}
      selectLabel="Staff Member"
      options={staffOptions
        .filter((s) => s.id !== currentStaffId)
        .map((s) => ({ value: s.id, label: s.full_name }))}
      confirmLabel={currentStaffId ? "Reassign" : "Assign"}
      onConfirm={async (staffId) => {
        const result = await assignLeadStaff(leadId, staffId);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        const staffName = staffOptions.find((s) => s.id === staffId)?.full_name ?? "Unknown";
        toast.success(currentStaffId ? "Staff reassigned successfully" : "Staff assigned successfully");
        onAssigned(staffId, staffName);
      }}
    />
  );
}
