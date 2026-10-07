"use client";

import { toast } from "sonner";
import { Dropdown, DropdownTrigger, DropdownContent } from "@/src/components/ui/dropdown";
import { LeadTemperatureBadge } from "@/src/components/leads/lead-temperature-badge";
import { changeLeadTemperature } from "@/app/admin/leads/actions";
import type { LeadTemperature } from "@/src/lib/types/lead";

const OPTIONS: LeadTemperature[] = ["Hot", "Warm", "Cold"];

interface TemperatureSelectorProps {
  leadId: string;
  value: LeadTemperature;
  onChanged: (next: LeadTemperature) => void;
}

export function TemperatureSelector({ leadId, value, onChanged }: TemperatureSelectorProps) {
  const handleSelect = async (next: LeadTemperature) => {
    if (next === value) return;
    const result = await changeLeadTemperature(leadId, next);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`Temperature changed to ${next}`);
    onChanged(next);
  };

  return (
    <Dropdown>
      <DropdownTrigger>
        <button type="button" aria-label={`Temperature: ${value}. Click to change.`}>
          <LeadTemperatureBadge temperature={value} />
        </button>
      </DropdownTrigger>
      <DropdownContent align="start" className="w-36 py-1">
        {OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            role="menuitem"
            onClick={() => handleSelect(option)}
            className="text-body-sm text-text-primary hover:bg-card-hover flex w-full items-center px-4 py-2 text-left"
          >
            <LeadTemperatureBadge temperature={option} />
          </button>
        ))}
      </DropdownContent>
    </Dropdown>
  );
}
