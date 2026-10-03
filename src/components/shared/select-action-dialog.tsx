"use client";

import { useState } from "react";
import { Modal } from "@/src/components/ui/modal";
import { Select } from "@/src/components/ui/select";
import { Button } from "@/src/components/ui/button";

interface SelectActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  selectLabel: string;
  options: { value: string; label: string }[];
  confirmLabel?: string;
  onConfirm: (value: string) => Promise<void>;
}

export function SelectActionDialog({
  isOpen,
  onClose,
  title,
  description,
  selectLabel,
  options,
  confirmLabel = "Apply",
  onConfirm,
}: SelectActionDialogProps) {
  const [value, setValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!value) return;
    setIsLoading(true);
    await onConfirm(value);
    setIsLoading(false);
    setValue("");
  };

  const handleClose = () => {
    setValue("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} isLoading={isLoading} disabled={!value}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <Select
        label={selectLabel}
        placeholder="Select an option"
        options={options}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </Modal>
  );
}
