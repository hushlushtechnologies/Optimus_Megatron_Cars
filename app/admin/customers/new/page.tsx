import { getCustomerFilterLookups } from "@/src/lib/supabase/customer-lookups";
import { createClient } from "@/src/lib/supabase/server";
import { AddCustomerForm } from "@/src/components/customers/add-customer/add-customer-form";

export default async function NewCustomerPage() {
  const supabase = await createClient();
  const [lookups, { data: sources }] = await Promise.all([
    getCustomerFilterLookups(),
    supabase.from("customer_sources").select("id, requires_detail"),
  ]);

  const sourcesWithDetail = Object.fromEntries((sources ?? []).map((s) => [s.id, s.requires_detail]));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-h1">Add Customer</h1>
        <p className="text-body-sm text-text-muted">Create a new customer profile.</p>
      </div>
      <AddCustomerForm lookups={lookups} sourcesWithDetail={sourcesWithDetail} />
    </div>
  );
}
