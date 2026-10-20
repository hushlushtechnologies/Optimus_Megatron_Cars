"use client";

import { useState } from "react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { FormSection } from "@/src/components/test-drives/form/form-section";
import { formatDay } from "@/src/lib/utils/test-drive-format";
import { cn } from "@/src/lib/utils/cn";
import type { SearchResult, TestDriveLeadOption } from "@/src/lib/types/test-drive";

type LeadMode = "none" | "link" | "create";

interface LeadSectionProps {
  hasCustomer: boolean;
  vehicleId: string;
  /** null while the customer's leads are loading. */
  leads: SearchResult<TestDriveLeadOption> | null;
  leadId: string | null;
  createLead: boolean;
  onChange: (leadId: string | null, createLead: boolean) => void;
  error?: string;
}

function ModeOption({
  name,
  checked,
  disabled,
  title,
  description,
  onSelect,
}: {
  name: string;
  checked: boolean;
  disabled?: boolean;
  title: string;
  description: string;
  onSelect: () => void;
}) {
  return (
    <label className={cn("relative block", disabled ? "cursor-not-allowed" : "cursor-pointer")}>
      <input
        type="radio"
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        className="peer sr-only"
      />
      <span
        className={cn(
          "peer-focus-visible:ring-primary flex h-full flex-col gap-0.5 rounded-lg border px-3 py-2.5 transition-colors peer-focus-visible:ring-2 motion-reduce:transition-none",
          checked ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-card-hover",
          disabled && "hover:bg-card opacity-50",
        )}
      >
        <span className={cn("text-body-sm font-medium", checked ? "text-primary-text" : "text-text-primary")}>
          {title}
        </span>
        <span className="text-caption text-text-muted">{description}</span>
      </span>
    </label>
  );
}

export function LeadSection({
  hasCustomer,
  vehicleId,
  leads,
  leadId,
  createLead,
  onChange,
  error,
}: LeadSectionProps) {
  const [wantsLink, setWantsLink] = useState(false);

  const mode: LeadMode = createLead ? "create" : leadId || wantsLink ? "link" : "none";
  const sameVehicleLead = vehicleId ? leads?.results.find((l) => l.car_id === vehicleId) : undefined;

  const selectMode = (next: LeadMode) => {
    setWantsLink(next === "link");
    if (next === "none") onChange(null, false);
    if (next === "link") onChange(leadId, false);
    if (next === "create") onChange(null, true);
  };

  return (
    <FormSection
      step={3}
      title="Related lead"
      description="Optional. Connect this test drive to a sales lead so the team sees the full story."
    >
      {!hasCustomer ? (
        <p className="text-body-sm text-text-muted">Choose a customer first.</p>
      ) : (
        <>
          <div role="radiogroup" aria-label="Related lead" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <ModeOption
              name="lead-mode"
              checked={mode === "none"}
              title="No lead"
              description="Just the test drive request."
              onSelect={() => selectMode("none")}
            />
            <ModeOption
              name="lead-mode"
              checked={mode === "link"}
              title="Link an existing lead"
              description="Pick one of this customer's open leads."
              onSelect={() => selectMode("link")}
            />
            <ModeOption
              name="lead-mode"
              checked={mode === "create"}
              disabled={!!sameVehicleLead}
              title="Create a new lead"
              description="Starts in the first pipeline stage."
              onSelect={() => selectMode("create")}
            />
          </div>

          {sameVehicleLead && (
            <p
              role="status"
              className="border-border bg-card-hover/60 text-body-sm text-text-muted rounded-md border px-3 py-2"
            >
              {sameVehicleLead.lead_number} is already open for this vehicle, so creating another would
              duplicate it. Link that one instead.
            </p>
          )}

          {mode === "link" &&
            (leads === null ? (
              <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading leads">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : leads.failed ? (
              <p role="alert" className="text-body-sm text-red-500">
                We couldn&apos;t load this customer&apos;s leads. Refresh the page to try again.
              </p>
            ) : leads.results.length === 0 ? (
              <p className="text-body-sm text-text-muted">
                This customer has no open leads. Choose &ldquo;Create a new lead&rdquo; instead.
              </p>
            ) : (
              <div role="radiogroup" aria-label="Choose a lead" className="flex flex-col gap-2">
                {leads.results.map((lead) => {
                  const selected = lead.id === leadId;
                  const isSameVehicle = !!vehicleId && lead.car_id === vehicleId;

                  return (
                    <label key={lead.id} className="relative block cursor-pointer">
                      <input
                        type="radio"
                        name="lead-choice"
                        checked={selected}
                        onChange={() => onChange(lead.id, false)}
                        className="peer sr-only"
                      />
                      <span
                        className={cn(
                          "peer-focus-visible:ring-primary flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors peer-focus-visible:ring-2 motion-reduce:transition-none",
                          selected
                            ? "border-primary bg-primary/10"
                            : "border-border bg-card hover:bg-card-hover",
                        )}
                      >
                        <span className="min-w-0">
                          <span className="text-body-sm text-text-primary block truncate font-medium">
                            {lead.lead_number}
                            <span className="text-text-subtle font-normal"> · {lead.stage_name}</span>
                          </span>
                          <span className="text-caption text-text-muted block truncate">
                            {lead.vehicle_title ?? "No vehicle linked"} · created {formatDay(lead.created_at)}
                          </span>
                        </span>
                        {isSameVehicle && (
                          <span className="bg-primary/15 text-caption text-primary-text shrink-0 rounded-full px-2 py-0.5">
                            Same vehicle
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            ))}

          {mode === "create" && (
            <p className="text-body-sm text-text-muted">
              A new lead is created for this customer and vehicle once the test drive is saved. It starts
              unassigned: give it an owner from the Leads page, separately from whoever hosts the drive.
            </p>
          )}

          {error && (
            <p role="alert" className="text-body-sm text-red-500">
              {error}
            </p>
          )}
        </>
      )}
    </FormSection>
  );
}
