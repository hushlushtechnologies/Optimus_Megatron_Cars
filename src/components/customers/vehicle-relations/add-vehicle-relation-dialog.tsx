"use client";

import { useEffect, useState } from "react";

import { toast } from "sonner";

import { Modal } from "@/src/components/ui/modal";
import { Combobox } from "@/src/components/ui/combobox";
import { Select } from "@/src/components/ui/select";
import { Button } from "@/src/components/ui/button";

import { addVehicleRelation, searchCarsForLink } from "@/app/admin/customers/[id]/vehicle-actions";

/* =========================================================
   TYPES
========================================================= */

interface AddVehicleRelationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  staffOptions: {
    id: string;
    name: string;
  }[];
}

interface CarOption {
  id: string;
  label: string;
}

/* =========================================================
   RELATIONSHIP TYPES
========================================================= */

const RELATIONSHIP_TYPE_VALUES = [
  "Interested",
  "Enquiry",
  "Test Drive",
  "Reserved",
  "Purchased",
  "Finance",
  "Trade-In",
  "Wishlist",
  "Dream Car",
] as const;

type RelationshipType = (typeof RELATIONSHIP_TYPE_VALUES)[number];

const RELATIONSHIP_TYPES = RELATIONSHIP_TYPE_VALUES.map((value) => ({
  value,
  label: value,
}));

/* =========================================================
   TYPE GUARD
========================================================= */

function isRelationshipType(value: string): value is RelationshipType {
  return (RELATIONSHIP_TYPE_VALUES as readonly string[]).includes(value);
}

/* =========================================================
   COMPONENT
========================================================= */

export function AddVehicleRelationDialog({
  isOpen,
  onClose,
  customerId,
  staffOptions,
}: AddVehicleRelationDialogProps) {
  const [carOptions, setCarOptions] = useState<CarOption[]>([]);

  const [carId, setCarId] = useState<string | null>(null);

  const [relationshipType, setRelationshipType] = useState<RelationshipType>("Interested");

  const [staffId, setStaffId] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  /* =========================================================
     LOAD VEHICLES
  ========================================================= */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    searchCarsForLink().then((cars) => {
      setCarOptions(
        cars.map((car) => ({
          id: car.id,

          label: `${car.display_title} · ${car.stock_id}`,
        })),
      );
    });
  }, [isOpen]);

  /* =========================================================
     RELATIONSHIP TYPE CHANGE
  ========================================================= */

  const handleRelationshipTypeChange = (value: string) => {
    if (isRelationshipType(value)) {
      setRelationshipType(value);
    }
  };

  /* =========================================================
     RESET
  ========================================================= */

  const reset = () => {
    setCarId(null);

    setRelationshipType("Interested");

    setStaffId("");
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit = async () => {
    if (!carId) {
      toast.error("Select a vehicle first.");

      return;
    }

    setIsSaving(true);

    const result = await addVehicleRelation(customerId, carId, relationshipType, staffId || null);

    setIsSaving(false);

    if (result.error) {
      toast.error(result.error);

      return;
    }

    toast.success("Vehicle linked successfully");

    reset();

    onClose();
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Link Vehicle"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>

          <Button onClick={handleSubmit} isLoading={isSaving} disabled={!carId}>
            Link Vehicle
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* VEHICLE */}

        <Combobox
          label="Vehicle"
          value={carId}
          onChange={setCarId}
          options={carOptions}
          placeholder="Search by name or stock ID..."
        />

        {/* RELATIONSHIP TYPE */}

        <Select
          label="Relationship Type"
          options={RELATIONSHIP_TYPES}
          value={relationshipType}
          onChange={(event) => handleRelationshipTypeChange(event.target.value)}
        />

        {/* ASSIGNED STAFF */}

        <Select
          label="Assigned Staff"
          placeholder="Unassigned"
          options={staffOptions.map((staff) => ({
            value: staff.id,
            label: staff.name,
          }))}
          value={staffId}
          onChange={(event) => setStaffId(event.target.value)}
        />
      </div>
    </Modal>
  );
}
