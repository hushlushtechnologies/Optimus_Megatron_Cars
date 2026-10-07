"use client";

import { Select } from "@/src/components/ui/select";
import type { LeadLostReason } from "@/src/lib/types/lead";

interface LeadLostReasonSelectorProps {
  reasons: LeadLostReason[];
  value: string | null;
  onChange: (reasonId: string) => void;
  error?: string;
}

export function LeadLostReasonSelector({ reasons, value, onChange, error }: LeadLostReasonSelectorProps) {
  return (
    <Select
      label="Lost Reason"
      placeholder="Select a reason"
      options={reasons.map((r) => ({ value: r.id, label: r.name }))}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      error={error}
    />
  );
}
