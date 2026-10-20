"use client";

import { MapPin, TriangleAlert } from "lucide-react";
import { FormSection } from "@/src/components/test-drives/form/form-section";
import { SearchSelect } from "@/src/components/test-drives/form/search-select";
import { searchTestDriveVehiclesAction } from "@/app/admin/test-drives/new/actions";
import type { TestDriveVehicleOption } from "@/src/lib/types/test-drive";

interface VehicleSectionProps {
  value: TestDriveVehicleOption | null;
  onChange: (vehicle: TestDriveVehicleOption | null) => void;
  /** Set when the vehicle is listed at a different showroom than the one chosen. */
  showroomMismatchMessage: string | null;
  error?: string;
}

function VehicleRow({ vehicle }: { vehicle: TestDriveVehicleOption }) {
  return (
    <div className="min-w-0">
      <p className="text-text-primary truncate font-medium">{vehicle.display_title}</p>
      <p className="text-caption text-text-subtle truncate">
        {vehicle.stock_id}
        {vehicle.brand_name ? ` · ${vehicle.brand_name}` : ""}
        {vehicle.location_name ? ` · ${vehicle.location_name}` : ""}
        {vehicle.status_name ? ` · ${vehicle.status_name}` : ""}
      </p>
    </div>
  );
}

export function VehicleSection({ value, onChange, showroomMismatchMessage, error }: VehicleSectionProps) {
  return (
    <FormSection step={2} title="Vehicle" description="Which vehicle does the customer want to drive?">
      <SearchSelect<TestDriveVehicleOption>
        label="Vehicle"
        required
        placeholder="Search by name, brand or stock ID…"
        value={value}
        onChange={onChange}
        search={searchTestDriveVehiclesAction}
        renderOption={(vehicle) => <VehicleRow vehicle={vehicle} />}
        renderSelected={(vehicle) => <VehicleRow vehicle={vehicle} />}
        emptyMessage="No vehicles found. Check the name or stock ID."
        isOptionDisabled={(vehicle) => vehicle.is_sold}
        getDisabledReason={() => "Sold"}
        error={error}
        helper="Each listing counts as one test drive car. Two listings of the same model are treated as different cars."
      />

      {value && (
        <div className="text-body-sm text-text-muted flex flex-wrap items-center gap-x-4 gap-y-1">
          {value.location_name && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" aria-hidden="true" />
              Listed at {value.location_name}
            </span>
          )}
          {value.status_name && <span>Status: {value.status_name}</span>}
        </div>
      )}

      {showroomMismatchMessage && (
        <p
          role="status"
          className="text-body-sm text-text-primary flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-400" aria-hidden="true" />
          {showroomMismatchMessage}
        </p>
      )}
    </FormSection>
  );
}
