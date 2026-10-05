"use client";

import { useEffect, useState } from "react";

import { toast } from "sonner";

import { Modal } from "@/src/components/ui/modal";
import { Select } from "@/src/components/ui/select";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Combobox } from "@/src/components/ui/combobox";
import { Button } from "@/src/components/ui/button";

import { logCommunication } from "@/app/admin/customers/[id]/communication-actions";
import { searchCarsForLink } from "@/app/admin/customers/[id]/vehicle-actions";

/* =========================================================
   TYPES
========================================================= */

const COMMUNICATION_TYPES = ["WhatsApp", "Email", "Phone Call", "Internal Note"] as const;

type CommunicationType = (typeof COMMUNICATION_TYPES)[number];

interface LogCommunicationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
}

interface CarOption {
  id: string;
  label: string;
}

/* =========================================================
   OPTIONS
========================================================= */

const TYPE_OPTIONS = COMMUNICATION_TYPES.map((value) => ({
  value,
  label: value,
}));

/* =========================================================
   HELPERS
========================================================= */

function isCommunicationType(value: string): value is CommunicationType {
  return (COMMUNICATION_TYPES as readonly string[]).includes(value);
}

/* =========================================================
   COMPONENT
========================================================= */

export function LogCommunicationDialog({ isOpen, onClose, customerId }: LogCommunicationDialogProps) {
  const [type, setType] = useState<CommunicationType>("Phone Call");

  const [subject, setSubject] = useState("");

  const [summary, setSummary] = useState("");

  const [carId, setCarId] = useState<string | null>(null);

  const [carOptions, setCarOptions] = useState<CarOption[]>([]);

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
     RESET
  ========================================================= */

  const reset = () => {
    setType("Phone Call");

    setSubject("");

    setSummary("");

    setCarId(null);
  };

  /* =========================================================
     TYPE CHANGE
  ========================================================= */

  const handleTypeChange = (value: string) => {
    if (isCommunicationType(value)) {
      setType(value);
    }
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit = async () => {
    if (!summary.trim()) {
      toast.error("Summary is required.");

      return;
    }

    setIsSaving(true);

    const result = await logCommunication(customerId, type, subject, summary, carId);

    setIsSaving(false);

    if (result.error) {
      toast.error(result.error);

      return;
    }

    toast.success("Communication logged");

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
      title="Log Communication"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>

          <Button onClick={handleSubmit} isLoading={isSaving} disabled={!summary.trim()}>
            Log Communication
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* TYPE */}

        <Select
          label="Type"
          options={TYPE_OPTIONS}
          value={type}
          onChange={(event) => handleTypeChange(event.target.value)}
        />

        {/* SUBJECT */}

        <Input
          label="Subject"
          placeholder="Optional"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
        />

        {/* SUMMARY */}

        <Textarea
          label="Summary"
          placeholder="What was discussed..."
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          rows={4}
        />

        {/* RELATED VEHICLE */}

        <Combobox
          label="Related Vehicle / Deal"
          placeholder="Optional — search by name or stock ID..."
          value={carId}
          onChange={setCarId}
          options={carOptions}
        />
      </div>
    </Modal>
  );
}
