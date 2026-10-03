"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UserCog, ChevronDown } from "lucide-react";
import { Dropdown, DropdownTrigger, DropdownContent } from "@/src/components/ui/dropdown";
import { Button } from "@/src/components/ui/button";

interface StaffOption {
  id: string;
  name: string;
}

interface StaffAssignmentCardProps {
  label: string;
  currentStaffId: string | null;
  currentStaffName: string | null;
  staffOptions: StaffOption[];
  onAssign: (staffId: string) => Promise<{ error: string | null }>;
}

export function StaffAssignmentCard({
  label,
  currentStaffId,
  currentStaffName,
  staffOptions,
  onAssign,
}: StaffAssignmentCardProps) {
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssign = async (staffId: string) => {
    setIsAssigning(true);
    const result = await onAssign(staffId);
    setIsAssigning(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Staff assigned successfully");
  };

  return (
    <div className="flex items-center gap-2.5">
      <UserCog className="text-text-muted size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-caption">{label}</p>
        <p className="text-body-sm text-text-primary truncate">{currentStaffName ?? "Unassigned"}</p>
      </div>
      <Dropdown>
        <DropdownTrigger>
          <Button
            variant="outline"
            size="sm"
            isLoading={isAssigning}
            rightIcon={<ChevronDown className="size-3.5" />}
          >
            Change
          </Button>
        </DropdownTrigger>
        <DropdownContent align="end" className="w-52 py-1">
          {staffOptions.map((staff) => (
            <button
              key={staff.id}
              type="button"
              role="menuitem"
              disabled={staff.id === currentStaffId}
              onClick={() => handleAssign(staff.id)}
              className="text-body-sm text-text-primary hover:bg-card-hover flex w-full items-center px-4 py-2 text-left disabled:opacity-50"
            >
              {staff.name}
            </button>
          ))}
        </DropdownContent>
      </Dropdown>
    </div>
  );
}
