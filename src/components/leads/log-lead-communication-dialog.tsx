"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/src/components/ui/modal";
import { Select } from "@/src/components/ui/select";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Combobox } from "@/src/components/ui/combobox";
import { Button } from "@/src/components/ui/button";
import { logLeadCommunication } from "@/app/admin/leads/[id]/communication-actions";
import { searchCarsForLead } from "@/app/admin/leads/new/actions";
import type { CommunicationType } from "@/src/lib/supabase/lead-communications-queries";

interface LogLeadCommunicationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  customerId: string;
}

const TYPE_OPTIONS: CommunicationType[] = ["WhatsApp", "Email", "Phone Call", "Internal Note"];

export function LogLeadCommunicationDialog({
  isOpen,
  onClose,
  leadId,
  customerId,
}: LogLeadCommunicationDialogProps) {
  const [type, setType] = useState<CommunicationType>("Phone Call");
  const [subject, setSubject] = useState("");
  const [summary, setSummary] = useState("");
  const [carId, setCarId] = useState<string | null>(null);
  const [carOptions, setCarOptions] = useState<{ id: string; label: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    searchCarsForLead().then((cars) =>
      setCarOptions(cars.map((c) => ({ id: c.id, label: `${c.display_title} · ${c.stock_id}` }))),
    );
  }, [isOpen]);

  const reset = () => {
    setType("Phone Call");
    setSubject("");
    setSummary("");
    setCarId(null);
  };

  const handleSubmit = async () => {
    if (!summary.trim()) {
      toast.error("Summary is required.");
      return;
    }
    setIsSaving(true);
    const result = await logLeadCommunication(leadId, customerId, type, subject, summary, carId);
    setIsSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Communication logged");
    reset();
    onClose();
  };

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
        <Select
          label="Type"
          options={TYPE_OPTIONS.map((v) => ({ value: v, label: v }))}
          value={type}
          onChange={(e) => setType(e.target.value as CommunicationType)}
        />
        <Input
          label="Subject"
          placeholder="Optional"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <Textarea
          label="Summary"
          placeholder="What was discussed..."
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={4}
        />
        <Combobox
          label="Related Vehicle"
          placeholder="Optional — search by name or stock ID..."
          value={carId}
          onChange={setCarId}
          options={carOptions}
        />
      </div>
    </Modal>
  );
}
