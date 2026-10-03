import { getCustomerVehicleRelations } from "@/src/lib/supabase/customer-vehicle-queries";

import { getCustomerFilterLookups } from "@/src/lib/supabase/customer-lookups";

import { VehicleRelationsList } from "@/src/components/customers/vehicle-relations/vehicle-relations-list";

export async function VehiclesTab({ customerId }: { customerId: string }) {
  const [relations, lookups] = await Promise.all([
    getCustomerVehicleRelations(customerId),
    getCustomerFilterLookups(),
  ]);

  return (
    <VehicleRelationsList
      customerId={customerId}
      relations={relations}
      staffOptions={lookups.staff.map((staff) => ({
        id: staff.id,
        name: staff.full_name,
      }))}
    />
  );
}
