"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/src/components/ui/modal";
import { Combobox } from "@/src/components/ui/combobox";
import { Select } from "@/src/components/ui/select";
import { Button } from "@/src/components/ui/button";
import { addVehicleRelation, searchCarsForLink } from "@/app/admin/customers/[id]/vehicle-actions";

interface AddVehicleRelationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  staffOptions: { id: string; name: string }[];
}

const RELATIONSHIP_TYPES = [
  "Interested",
  "Enquiry",
  "Test Drive",
  "Reserved",
  "Purchased",
  "Finance",
  "Trade-In",
  "Wishlist",
  "Dream Car",
].map((v) => ({ value: v, label: v }));

export function AddVehicleRelationDialog({
  isOpen,
  onClose,
  customerId,
  staffOptions,
}: AddVehicleRelationDialogProps) {
  const [carOptions, setCarOptions] = useState<{ id: string; label: string }[]>([]);
  const [carId, setCarId] = useState<string | null>(null);
  const [relationshipType, setRelationshipType] = useState("Interested");
  const [staffId, setStaffId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    searchCarsForLink().then((cars) =>
      setCarOptions(cars.map((c) => ({ id: c.id, label: `${c.display_title} · ${c.stock_id}` }))),
    );
  }, [isOpen]);

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
    setCarId(null);
    setRelationshipType("Interested");
    setStaffId("");
    onClose();
  };

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
          <Button onClick={handleSubmit} isLoading={isSaving}>
            Link Vehicle
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Combobox
          label="Vehicle"
          value={carId}
          onChange={setCarId}
          options={carOptions}
          placeholder="Search by name or stock ID..."
        />
        <Select
          label="Relationship Type"
          options={RELATIONSHIP_TYPES}
          value={relationshipType}
          onChange={(e) => setRelationshipType(e.target.value)}
        />
        <Select
          label="Assigned Staff"
          placeholder="Unassigned"
          options={staffOptions.map((s) => ({ value: s.id, label: s.name }))}
          value={staffId}
          onChange={(e) => setStaffId(e.target.value)}
        />
      </div>
    </Modal>
  );
}
