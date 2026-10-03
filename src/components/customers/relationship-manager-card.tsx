"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown, UserCog } from "lucide-react";

import { Dropdown, DropdownContent, DropdownTrigger } from "@/src/components/ui/dropdown";
import { Button } from "@/src/components/ui/button";

import { updatePrimaryRelationshipManager } from "@/app/admin/customers/[id]/actions";

interface StaffOption {
  id: string;
  name: string;
}

interface RelationshipManagerCardProps {
  customerId: string;
  currentStaffId: string | null;
  currentStaffName: string | null;
  staffOptions: StaffOption[];
}

export function RelationshipManagerCard({
  customerId,
  currentStaffId,
  currentStaffName,
  staffOptions,
}: RelationshipManagerCardProps) {
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssign = async (staffId: string) => {
    if (staffId === currentStaffId) {
      return;
    }

    setIsAssigning(true);

    try {
      const result = await updatePrimaryRelationshipManager(customerId, staffId);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Relationship manager updated successfully");
    } catch (error) {
      console.error("Relationship manager update failed:", error);

      toast.error("Unable to update relationship manager. Please try again.");
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="flex items-center gap-2.5">
      <UserCog className="text-text-muted size-4 shrink-0" aria-hidden="true" />

      <div className="min-w-0 flex-1">
        <p className="text-caption">Primary Relationship Manager</p>

        <p className="text-body-sm text-text-primary truncate">{currentStaffName ?? "Unassigned"}</p>
      </div>

      <Dropdown>
        <DropdownTrigger>
          <Button
            variant="outline"
            size="sm"
            isLoading={isAssigning}
            rightIcon={<ChevronDown className="size-3.5" aria-hidden="true" />}
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
              disabled={staff.id === currentStaffId || isAssigning}
              onClick={() => handleAssign(staff.id)}
              className="text-body-sm text-text-primary hover:bg-card-hover flex w-full items-center px-4 py-2 text-left disabled:cursor-not-allowed disabled:opacity-50"
            >
              {staff.name}
            </button>
          ))}
        </DropdownContent>
      </Dropdown>
    </div>
  );
}
