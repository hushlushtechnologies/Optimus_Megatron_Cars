"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/src/components/ui/modal";
import { Select } from "@/src/components/ui/select";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { bulkScheduleFollowUp } from "@/app/admin/leads/actions";
import type { FollowUpType } from "@/src/lib/types/lead";

const TYPE_OPTIONS: FollowUpType[] = [
  "Phone Call",
  "WhatsApp",
  "Email",
  "Showroom Visit",
  "Test Drive",
  "General Follow-Up",
];

interface BulkFollowUpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  leadIds: string[];
  onDone: (summary: string) => void;
}

export function BulkFollowUpDialog({ isOpen, onClose, leadIds, onDone }: BulkFollowUpDialogProps) {
  const [type, setType] = useState<FollowUpType>("Phone Call");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    setIsSaving(true);
    const result = await bulkScheduleFollowUp(leadIds, type, date, time);
    setIsSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    onDone(result.summary ?? "Follow-ups scheduled");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Schedule Follow-Up for ${leadIds.length} Lead${leadIds.length === 1 ? "" : "s"}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isSaving} disabled={!date}>
            Schedule
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Select
          label="Type"
          options={TYPE_OPTIONS.map((t) => ({ value: t, label: t }))}
          value={type}
          onChange={(e) => setType(e.target.value as FollowUpType)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          <Input label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}
