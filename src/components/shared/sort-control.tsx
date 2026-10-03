"use client";

import { ArrowDownUp, Check } from "lucide-react";
import { Dropdown, DropdownTrigger, DropdownContent } from "@/src/components/ui/dropdown";
import { Button } from "@/src/components/ui/button";

interface SortOption {
  value: string;
  label: string;
}

interface SortControlProps {
  options: SortOption[];
  value: string;
  onChange: (value: string) => void;
}

export function SortControl({ options, value, onChange }: SortControlProps) {
  const current = options.find((o) => o.value === value);

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button variant="outline" size="sm" leftIcon={<ArrowDownUp className="size-4" />}>
          {current?.label ?? "Sort"}
        </Button>
      </DropdownTrigger>
      <DropdownContent align="start" className="w-56 py-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="menuitemradio"
            aria-checked={option.value === value}
            onClick={() => onChange(option.value)}
            className="text-body-sm text-text-primary hover:bg-card-hover flex w-full items-center justify-between px-4 py-2 text-left"
          >
            {option.label}
            {option.value === value && <Check className="text-primary size-4" aria-hidden="true" />}
          </button>
        ))}
      </DropdownContent>
    </Dropdown>
  );
}
