"use client";

import { useState } from "react";
import { toast } from "sonner";
import { History, Plus } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { Select } from "@/src/components/ui/select";
import { EmptyState } from "@/src/components/shared/empty-state";

import { VehicleDealCard } from "@/src/components/customers/vehicle-deal-card";

import { StaffAssignmentCard } from "@/src/components/customers/staff-assignment-card";

import { AddVehicleRelationDialog } from "@/src/components/customers/vehicle-relations/add-vehicle-relation-dialog";

import { AssignmentHistoryDialog } from "@/src/components/customers/vehicle-relations/assignment-history-dialog";

import { changeRelationshipStatus } from "@/app/admin/customers/[id]/vehicle-actions";

import type { VehicleRelationRow } from "@/src/lib/supabase/customer-vehicle-queries";

import type { RelationshipStatus } from "@/src/lib/types/customer";

/* =========================================================
   TYPES
========================================================= */

interface VehicleRelationsListProps {
  customerId: string;
  relations: VehicleRelationRow[];

  staffOptions: {
    id: string;
    name: string;
  }[];
}

/* =========================================================
   STATUS OPTIONS
========================================================= */

const STATUS_OPTIONS: {
  value: RelationshipStatus;
  label: string;
}[] = [
  {
    value: "Active",
    label: "Active",
  },
  {
    value: "Completed",
    label: "Completed",
  },
  {
    value: "Cancelled",
    label: "Cancelled",
  },
];

/* =========================================================
   COMPONENT
========================================================= */

export function VehicleRelationsList({ customerId, relations, staffOptions }: VehicleRelationsListProps) {
  const [addOpen, setAddOpen] = useState(false);

  const [historyRelationId, setHistoryRelationId] = useState<string | null>(null);

  /* =========================================================
     STATUS CHANGE
  ========================================================= */

  const handleStatusChange = async (relationId: string, status: RelationshipStatus) => {
    try {
      const result = await changeRelationshipStatus(relationId, status, customerId);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Status updated");
    } catch (error) {
      console.error("Relationship status update failed:", error);

      toast.error("Unable to update status. Please try again.");
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button size="sm" leftIcon={<Plus className="size-4" />} onClick={() => setAddOpen(true)}>
          Link Vehicle
        </Button>
      </div>

      {relations.length === 0 ? (
        <EmptyState
          title="No vehicles or deals yet"
          description="Link this customer to a vehicle to start tracking interest, test drives, reservations, or purchases."
          action={{
            label: "Link Vehicle",
            onClick: () => setAddOpen(true),
          }}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {relations.map((relation) => (
            <VehicleDealCard
              key={relation.id}
              carId={relation.car.id}
              vehicleTitle={relation.car.display_title}
              vehicleImageUrl={relation.car.featured_image_url}
              relationshipType={relation.relationship_type}
              relationshipStatus={relation.relationship_status}
              assignedStaffName={relation.assigned_staff_name}
              updatedAt={relation.updated_at}
              actions={
                <div className="flex flex-col items-stretch gap-2 sm:w-56">
                  <StaffAssignmentCard
                    label="Assigned Staff"
                    relationId={relation.id}
                    customerId={customerId}
                    currentStaffId={relation.assigned_staff_id}
                    currentStaffName={relation.assigned_staff_name}
                    staffOptions={staffOptions}
                  />

                  <div className="flex items-center justify-between gap-2">
                    <div className="w-32">
                      <Select
                        aria-label="Relationship status"
                        options={STATUS_OPTIONS}
                        value={relation.relationship_status}
                        onChange={(event) =>
                          handleStatusChange(relation.id, event.target.value as RelationshipStatus)
                        }
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setHistoryRelationId(relation.id)}
                      className="text-caption text-primary-text hover:text-primary-hover flex items-center gap-1"
                    >
                      <History className="size-3" aria-hidden="true" />
                      History
                    </button>
                  </div>
                </div>
              }
            />
          ))}
        </div>
      )}

      <AddVehicleRelationDialog
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        customerId={customerId}
        staffOptions={staffOptions}
      />

      <AssignmentHistoryDialog
        isOpen={historyRelationId !== null}
        onClose={() => setHistoryRelationId(null)}
        relationId={historyRelationId}
      />
    </div>
  );
}
